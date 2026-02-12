"""
Favorites Integration for Home Assistant.
Provides a HomeKit-like favorites system with per-user support.
"""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Any
import os  # Moved to top

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EVENT_HOMEASSISTANT_STARTED, Platform
from homeassistant.core import CoreState, HomeAssistant, ServiceCall, callback
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.storage import Store
from homeassistant.helpers.typing import ConfigType
from homeassistant.loader import async_get_integration

_LOGGER = logging.getLogger(__name__)

DOMAIN = "favorites"
STORAGE_VERSION = 1
STORAGE_KEY = DOMAIN

PLATFORMS: list[Platform] = [Platform.SENSOR, Platform.BINARY_SENSOR]

# --- ADDED: CONSTANTS FOR ASSET SERVING ---
ASSET_URL_PATH = f"/{DOMAIN}_static"
# ------------------------------------------

SERVICE_ADD = "add"
SERVICE_REMOVE = "remove"
SERVICE_TOGGLE = "toggle"
SERVICE_REORDER = "reorder"
SERVICE_CLEAR = "clear"
SERVICE_UPDATE = "update"
SERVICE_RESTORE = "restore"
SERVICE_SET_ENTITY_THEME = "set_entity_theme"
SERVICE_CLEAR_RECENTLY_REMOVED = "clear_recently_removed"
SERVICE_GET_RECENTLY_REMOVED = "get_recently_removed"

# Admin services
SERVICE_ADMIN_GET_ALL = "admin_get_all"
SERVICE_ADMIN_ADD_DEFAULT = "admin_add_default"
SERVICE_ADMIN_REMOVE_ENTITY = "admin_remove_entity"
SERVICE_ADMIN_REORDER = "admin_reorder"
SERVICE_ADMIN_CLONE = "admin_clone"
SERVICE_ADMIN_SET_ENTITY_LOCK = "admin_set_entity_lock"
SERVICE_ADMIN_SET_USER_LOCK = "admin_set_user_lock"
SERVICE_ADMIN_SAVE_PRESET = "admin_save_preset"
SERVICE_ADMIN_APPLY_PRESET = "admin_apply_preset"
SERVICE_ADMIN_DELETE_PRESET = "admin_delete_preset"

ATTR_ENTITY_ID = "entity_id"
ATTR_USER_ID = "user_id"
ATTR_CUSTOM_NAME = "custom_name"
ATTR_CUSTOM_ICON = "custom_icon"
ATTR_ENTITY_IDS = "entity_ids"
ATTR_THEME = "theme"
ATTR_TARGET_USER_IDS = "target_user_ids"
ATTR_LOCKED = "locked"
ATTR_NAME = "name"
ATTR_SOURCE_USER_ID = "source_user_id"
ATTR_TARGET_USER_ID = "target_user_id"

EVENT_FAVORITES_CHANGED = "favorites_changed"
EVENT_RECENTLY_REMOVED_CHANGED = "favorites_recently_removed_changed"
EVENT_ADMIN_DATA = "favorites_admin_data"


class FavoritesStore:
    """Manage favorites storage with per-user support."""

    MAX_RECENTLY_REMOVED = 20

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize the store."""
        self.hass = hass
        self._store: Store = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self._data: dict[str, Any] = {
            "users": {},
            "recently_removed": {},
            "locked_entities": {},
            "locked_users": [],
            "presets": {},
        }

    async def async_load(self) -> None:
        """Load data from storage."""
        data = await self._store.async_load()
        if data:
            if "items" in data and "users" not in data:
                _LOGGER.info("Migrating favorites to per-user format")
                self._data = {
                    "users": {"migrated_default": data["items"]},
                    "recently_removed": {},
                    "locked_entities": {},
                    "locked_users": [],
                    "presets": {},
                }
                await self.async_save()
            elif "users" in data:
                self._data = data
                # Ensure all fields exist (migration)
                if "recently_removed" not in self._data:
                    self._data["recently_removed"] = {}
                if "locked_entities" not in self._data:
                    self._data["locked_entities"] = {}
                if "locked_users" not in self._data:
                    self._data["locked_users"] = []
                if "presets" not in self._data:
                    self._data["presets"] = {}
            else:
                self._data = {
                    "users": {},
                    "recently_removed": {},
                    "locked_entities": {},
                    "locked_users": [],
                    "presets": {},
                }
        else:
            self._data = {
                "users": {},
                "recently_removed": {},
                "locked_entities": {},
                "locked_users": [],
                "presets": {},
            }

    async def async_save(self) -> None:
        """Save data from storage."""
        await self._store.async_save(self._data)

    @property
    def users(self) -> dict[str, list[dict[str, Any]]]:
        """Return the full users dict (copy to avoid reference issues)."""
        return dict(self._data.get("users", {}))

    @property
    def recently_removed(self) -> dict[str, list[dict[str, Any]]]:
        """Return the recently removed dict (copy to avoid reference issues)."""
        return dict(self._data.get("recently_removed", {}))

    def get_user_items(self, user_id: str) -> list[dict[str, Any]]:
        """Return the list of favorite items for a specific user."""
        return self._data.get("users", {}).get(user_id, [])

    def get_user_entity_ids(self, user_id: str) -> list[str]:
        """Return list of favorited entity IDs for a specific user."""
        return [item["entity_id"] for item in self.get_user_items(user_id)]

    def get_recently_removed_items(self, user_id: str) -> list[dict[str, Any]]:
        """Return list of recently removed items for a specific user, filtering out active favorites."""
        recently_removed = self._data.get("recently_removed", {}).get(user_id, [])
        active_ids = self.get_user_entity_ids(user_id)
        
        # Filter out items that are currently in favorites (ghosts)
        return [item for item in recently_removed if item["entity_id"] not in active_ids]

    def is_favorite(self, user_id: str, entity_id: str) -> bool:
        """Check if an entity is favorited by a specific user."""
        return any(item["entity_id"] == entity_id for item in self.get_user_items(user_id))

    def get_item(self, user_id: str, entity_id: str) -> dict[str, Any] | None:
        """Get a favorite item by entity_id for a specific user."""
        for item in self.get_user_items(user_id):
            if item["entity_id"] == entity_id:
                return item
        return None

    async def async_add(
        self,
        user_id: str,
        entity_id: str,
        custom_name: str | None = None,
        custom_icon: str | None = None,
        bypass_lock: bool = False,
    ) -> bool:
        """Add an entity to favorites for a specific user."""
        if not bypass_lock and self.is_user_locked(user_id):
            _LOGGER.warning("User %s is locked, cannot add favorites", user_id)
            return False
        if self.is_favorite(user_id, entity_id):
            return False

        if user_id not in self._data["users"]:
            self._data["users"][user_id] = []

        area_id = None
        try:
            entity_registry = er.async_get(self.hass)
            if entry := entity_registry.async_get(entity_id):
                area_id = entry.area_id
        except Exception:
            pass

        user_items = self.get_user_items(user_id)
        new_item = {
            "entity_id": entity_id,
            "added_at": datetime.now().isoformat(),
            "order": len(user_items),
            "custom_name": custom_name,
            "custom_icon": custom_icon,
            "area_id": area_id,
        }

        new_user_items = [*user_items, new_item]
        self._data["users"] = {**self._data.get("users", {}), user_id: new_user_items}
        
        # Check if it was in recently_removed, if so, remove it (it's back!)
        if user_id in self._data.get("recently_removed", {}):
            recent = self._data["recently_removed"][user_id]
            # Filter out this entity
            new_recent = [x for x in recent if x["entity_id"] != entity_id]
            if len(new_recent) != len(recent):
                self._data["recently_removed"][user_id] = new_recent

        await self.async_save()
        return True

    async def async_remove(self, user_id: str, entity_id: str, bypass_lock: bool = False) -> bool:
        """Remove an entity from favorites for a specific user and archive it."""
        if not bypass_lock and self.is_user_locked(user_id):
            _LOGGER.warning("User %s is locked, cannot remove favorites", user_id)
            return False
        if not bypass_lock and self.is_entity_locked(user_id, entity_id):
            _LOGGER.warning("Entity %s is locked for user %s, cannot remove", entity_id, user_id)
            return False
        if user_id not in self._data["users"]:
            return False

        user_items = self.get_user_items(user_id)
        removed_item = None
        new_items = []
        
        # Determine removal candidate (first match usually, but we want to capture it for history)
        # scan for ANY match to remove all, but keep one for history
        found_match = False
        
        for item in user_items:
            if item["entity_id"] == entity_id:
                if not found_match:
                    removed_item = item.copy()
                    found_match = True
                # Skip adding to new_items -> effectively removes ALL duplicates
            else:
                new_items.append(item)

        if found_match and removed_item:
            # Re-order remaining items
            for i, item in enumerate(new_items):
                item["order"] = i
            self._data["users"] = {**self._data.get("users", {}), user_id: new_items}
            
            # Archive to recently_removed (max 20 items)
            removed_item["removed_at"] = datetime.now().isoformat()
            if "recently_removed" not in self._data:
                self._data["recently_removed"] = {}
            if user_id not in self._data["recently_removed"]:
                self._data["recently_removed"][user_id] = []
            
            # Check if this specific entity is ALREADY in recently removed (to prevent history spam)
            # Remove existing history entry if present, so we bump it to the top
            current_history = [x for x in self._data["recently_removed"][user_id] if x["entity_id"] != entity_id]
            
            # Add to front of list
            current_history.insert(0, removed_item)
            
            # Trim to max items
            if len(current_history) > self.MAX_RECENTLY_REMOVED:
                current_history = current_history[:self.MAX_RECENTLY_REMOVED]
                
            self._data["recently_removed"][user_id] = current_history
            
            await self.async_save()
            return True
        return False

    async def async_toggle(self, user_id: str, entity_id: str) -> bool:
        """Toggle favorite status for a specific user."""
        if self.is_user_locked(user_id):
            _LOGGER.warning("User %s is locked, cannot toggle favorites", user_id)
            return self.is_favorite(user_id, entity_id)
        if self.is_favorite(user_id, entity_id):
            if self.is_entity_locked(user_id, entity_id):
                _LOGGER.warning("Entity %s is locked for user %s, cannot remove", entity_id, user_id)
                return True
            await self.async_remove(user_id, entity_id)
            return False
        else:
            await self.async_add(user_id, entity_id)
            return True

    async def async_reorder(self, user_id: str, entity_ids: list[str], bypass_lock: bool = False) -> None:
        """Reorder favorites based on provided entity_id list for a specific user."""
        if not bypass_lock and self.is_user_locked(user_id):
            _LOGGER.warning("User %s is locked, cannot reorder favorites", user_id)
            return
        if user_id not in self._data["users"]:
            return

        user_items = self.get_user_items(user_id)
        item_map = {item["entity_id"]: item for item in user_items}
        new_items = []

        for i, entity_id in enumerate(entity_ids):
            if entity_id in item_map:
                item = item_map[entity_id]
                item["order"] = i
                new_items.append(item)

        for item in user_items:
            if item["entity_id"] not in entity_ids:
                item["order"] = len(new_items)
                new_items.append(item)

        self._data["users"] = {**self._data.get("users", {}), user_id: new_items}
        await self.async_save()

    async def async_clear(self, user_id: str) -> None:
        """Clear all favorites for a specific user."""
        self._data["users"] = {**self._data.get("users", {}), user_id: []}
        await self.async_save()

    async def async_update(
        self,
        user_id: str,
        entity_id: str,
        custom_name: str | None = None,
    ) -> bool:
        """Update a favorite's custom name for a specific user."""
        if user_id not in self._data["users"]:
            return False

        user_items = self.get_user_items(user_id)
        updated = False
        
        for item in user_items:
            if item["entity_id"] == entity_id:
                item["custom_name"] = custom_name
                updated = True
                break
        
        if updated:
            self._data["users"] = {**self._data.get("users", {}), user_id: user_items}
            await self.async_save()
        
        return updated

    async def async_restore(self, user_id: str, entity_id: str) -> bool:
        """Restore a recently removed entity back to favorites."""
        if user_id not in self._data.get("recently_removed", {}):
            return False
        
        recently_removed = self._data["recently_removed"][user_id]
        restored_item = None
        new_recently_removed = []
        
        for item in recently_removed:
            if item["entity_id"] == entity_id and restored_item is None:
                restored_item = item.copy()
                # Remove removed_at since it's being restored
                restored_item.pop("removed_at", None)
            else:
                new_recently_removed.append(item)
        
        if restored_item:
            # Update history first
            self._data["recently_removed"][user_id] = new_recently_removed
            
            # Check if ALREADY in favorites to prevent duplicate
            if self.is_favorite(user_id, entity_id):
                # Just consume the restore action, don't add duplicate
                await self.async_save()
                return True

            # Add back to favorites
            if user_id not in self._data["users"]:
                self._data["users"][user_id] = []
            
            user_items = self.get_user_items(user_id)
            restored_item["order"] = len(user_items)
            restored_item["added_at"] = datetime.now().isoformat()
            
            self._data["users"][user_id] = [*user_items, restored_item]
            
            await self.async_save()
            return True
        return False

    async def async_set_entity_theme(
        self,
        user_id: str,
        entity_id: str,
        theme: str | None = None,
    ) -> bool:
        """Set a per-entity theme preference."""
        if user_id not in self._data["users"]:
            return False

        user_items = self.get_user_items(user_id)
        updated = False
        
        for item in user_items:
            if item["entity_id"] == entity_id:
                item["theme"] = theme
                updated = True
                break
        
        if updated:
            self._data["users"] = {**self._data.get("users", {}), user_id: user_items}
            await self.async_save()
        
        return updated

    async def async_clear_recently_removed(self, user_id: str) -> None:
        """Clear recently removed list for a specific user."""
        if "recently_removed" in self._data and user_id in self._data["recently_removed"]:
            self._data["recently_removed"][user_id] = []
            await self.async_save()

    # ================================================================
    # LOCK METHODS
    # ================================================================

    def is_entity_locked(self, user_id: str, entity_id: str) -> bool:
        """Check if an entity is locked for a user."""
        return entity_id in self._data.get("locked_entities", {}).get(user_id, [])

    def is_user_locked(self, user_id: str) -> bool:
        """Check if a user is in lock mode (cannot modify favorites)."""
        return user_id in self._data.get("locked_users", [])

    def get_locked_entities(self, user_id: str) -> list[str]:
        """Return list of locked entity IDs for a user."""
        return list(self._data.get("locked_entities", {}).get(user_id, []))

    async def async_set_entity_lock(
        self, user_id: str, entity_id: str, locked: bool
    ) -> bool:
        """Lock or unlock an entity for a user."""
        if "locked_entities" not in self._data:
            self._data["locked_entities"] = {}
        if user_id not in self._data["locked_entities"]:
            self._data["locked_entities"][user_id] = []

        current = self._data["locked_entities"][user_id]
        if locked and entity_id not in current:
            current.append(entity_id)
            await self.async_save()
            return True
        elif not locked and entity_id in current:
            current.remove(entity_id)
            await self.async_save()
            return True
        return False

    async def async_set_user_lock(self, user_id: str, locked: bool) -> bool:
        """Lock or unlock a user (prevent all modifications)."""
        if "locked_users" not in self._data:
            self._data["locked_users"] = []

        current = self._data["locked_users"]
        if locked and user_id not in current:
            current.append(user_id)
            await self.async_save()
            return True
        elif not locked and user_id in current:
            current.remove(user_id)
            await self.async_save()
            return True
        return False

    # ================================================================
    # ADMIN METHODS
    # ================================================================

    def get_all_users_favorites(self) -> dict[str, Any]:
        """Return all users' favorites, locked entities, locked users, and presets."""
        import copy
        return {
            "users": copy.deepcopy(self._data.get("users", {})),
            "locked_entities": copy.deepcopy(self._data.get("locked_entities", {})),
            "locked_users": list(self._data.get("locked_users", [])),
            "presets": copy.deepcopy(self._data.get("presets", {})),
        }

    async def async_admin_add_default(
        self,
        entity_id: str,
        target_user_ids: list[str] | None = None,
        custom_name: str | None = None,
    ) -> list[str]:
        """Add an entity to all or specific users. Returns list of affected user IDs."""
        if target_user_ids is None:
            target_user_ids = list(self._data.get("users", {}).keys())

        affected = []
        for uid in target_user_ids:
            if await self.async_add(uid, entity_id, custom_name=custom_name, bypass_lock=True):
                affected.append(uid)
        return affected

    async def async_admin_remove_entity(
        self, entity_id: str, target_user_ids: list[str]
    ) -> list[str]:
        """Remove an entity from specific users. Returns list of affected user IDs."""
        affected = []
        for uid in target_user_ids:
            if await self.async_remove(uid, entity_id, bypass_lock=True):
                affected.append(uid)
        return affected

    async def async_admin_clone(
        self, source_user_id: str, target_user_id: str
    ) -> bool:
        """Clone all favorites from source user to target user."""
        import copy
        source_items = self.get_user_items(source_user_id)
        if not source_items:
            return False

        cloned_items = copy.deepcopy(source_items)
        # Reset added_at and order
        for i, item in enumerate(cloned_items):
            item["added_at"] = datetime.now().isoformat()
            item["order"] = i

        self._data["users"][target_user_id] = cloned_items
        await self.async_save()
        return True

    def get_activity_log(self) -> list[dict[str, Any]]:
        """Return recently removed items across ALL users, sorted by time."""
        all_items = []
        for user_id, items in self._data.get("recently_removed", {}).items():
            for item in items:
                entry = {**item, "user_id": user_id}
                all_items.append(entry)

        # Sort by removed_at descending (most recent first)
        all_items.sort(
            key=lambda x: x.get("removed_at", ""),
            reverse=True,
        )
        return all_items[:50]  # Cap at 50 entries

    # ================================================================
    # PRESET METHODS
    # ================================================================

    def get_presets(self) -> dict[str, Any]:
        """Return all saved presets."""
        import copy
        return copy.deepcopy(self._data.get("presets", {}))

    async def async_save_preset(
        self, name: str, entity_ids: list[str]
    ) -> bool:
        """Save a named preset (list of entity IDs)."""
        if "presets" not in self._data:
            self._data["presets"] = {}

        self._data["presets"][name] = {
            "entity_ids": entity_ids,
            "created_at": datetime.now().isoformat(),
        }
        await self.async_save()
        return True

    async def async_apply_preset(
        self, name: str, target_user_ids: list[str] | None = None
    ) -> list[str]:
        """Apply a preset to all or specific users. Returns affected user IDs."""
        preset = self._data.get("presets", {}).get(name)
        if not preset:
            return []

        if target_user_ids is None:
            target_user_ids = list(self._data.get("users", {}).keys())

        affected = []
        for entity_id in preset["entity_ids"]:
            for uid in target_user_ids:
                if await self.async_add(uid, entity_id, bypass_lock=True):
                    if uid not in affected:
                        affected.append(uid)
        return affected

    async def async_delete_preset(self, name: str) -> bool:
        """Delete a saved preset."""
        if name in self._data.get("presets", {}):
            del self._data["presets"][name]
            await self.async_save()
            return True
        return False

async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up from YAML — also registers static path early for HACS installs."""
    try:
        integration = await async_get_integration(hass, DOMAIN)
        www_path = os.path.join(integration.file_path, "www")

        if os.path.isdir(www_path):
            # Register static path as early as possible so the JS files
            # are already servable by the time Lovelace tries to load them.
            hass.http.register_static_path(
                ASSET_URL_PATH,
                www_path,
                cache_headers=True,
            )
            _LOGGER.debug("Static path registered: %s -> %s", ASSET_URL_PATH, www_path)
        else:
            _LOGGER.warning(
                "Favorites www directory not found at %s — cards will not be available",
                www_path,
            )
    except Exception as err:
        _LOGGER.error("Failed to register static path in async_setup: %s", err)

    return True


async def async_register_resources(hass: HomeAssistant) -> None:
    """Register Lovelace resources with retry logic and YAML-mode fallback."""
    import asyncio

    try:
        integration = await async_get_integration(hass, DOMAIN)
        version = integration.version
        www_path = os.path.join(integration.file_path, "www")

        if not os.path.isdir(www_path):
            return  # already warned in async_setup

        card_files = [
            ("favoritable-card.js", "favoritable-card"),
            ("favorites-grid-card.js", "favorites-grid-card"),
            ("favorites-admin-card.js", "favorites-admin-card"),
        ]

        # Build the list of URLs for logging / fallback
        urls = []
        for filename, _ in card_files:
            if os.path.isfile(os.path.join(www_path, filename)):
                urls.append(f"{ASSET_URL_PATH}/{filename}?v={version}")

        async def _try_register() -> bool:
            """Attempt to register resources. Returns True on success."""
            if "lovelace" not in hass.data:
                return False

            ll = hass.data["lovelace"]
            resources = ll.get("resources")

            # Detect YAML-mode Lovelace (resources collection is None)
            if resources is None:
                mode = getattr(ll.get("mode", None), "value", ll.get("mode", "unknown"))
                _LOGGER.warning(
                    "Lovelace is in %s mode — automatic resource registration "
                    "is not supported. Please add the following resources manually "
                    "to your Lovelace configuration:",
                    mode,
                )
                for url in urls:
                    _LOGGER.warning("  - url: %s", url)
                    _LOGGER.warning("    type: module")
                return True  # Don't retry, it won't help

            for filename, card_type in card_files:
                file_path = os.path.join(www_path, filename)
                if not os.path.isfile(file_path):
                    _LOGGER.debug("Card file not found, skipping: %s", filename)
                    continue

                url = f"{ASSET_URL_PATH}/{filename}?v={version}"

                try:
                    existing_resources = await resources.async_items()
                except Exception:
                    _LOGGER.warning("Could not fetch existing resources for %s", filename)
                    continue

                resource_id = None
                resource_needs_update = False

                for res in existing_resources:
                    res_url = res.get("url", "")
                    if (
                        res_url.startswith(f"{ASSET_URL_PATH}/{filename}")
                        and res.get("type") == "module"
                    ):
                        resource_id = res.get("id")
                        if res_url != url:
                            resource_needs_update = True
                        break

                if not resource_id:
                    await resources.async_create_item({
                        "type": "module",
                        "url": url,
                    })
                    _LOGGER.info("Automatically registered resource: %s", url)
                elif resource_needs_update:
                    await resources.async_update_item(resource_id, {
                        "url": url,
                    })
                    _LOGGER.info("Updated resource version: %s", url)
                else:
                    _LOGGER.debug("Resource already registered: %s", url)

            return True

        async def _register_with_retry(event=None):
            """Try registering resources, retry up to 3 times if Lovelace isn't ready."""
            max_attempts = 3
            for attempt in range(1, max_attempts + 1):
                try:
                    success = await _try_register()
                    if success:
                        return
                    if attempt < max_attempts:
                        _LOGGER.debug(
                            "Lovelace not ready yet (attempt %d/%d), retrying in 5s...",
                            attempt,
                            max_attempts,
                        )
                        await asyncio.sleep(5)
                except Exception as err:
                    _LOGGER.error(
                        "Error registering resources (attempt %d/%d): %s",
                        attempt,
                        max_attempts,
                        err,
                    )
                    if attempt < max_attempts:
                        await asyncio.sleep(5)

            # All retries exhausted — log manual fallback
            _LOGGER.warning(
                "Could not auto-register Lovelace resources after %d attempts. "
                "Please add the following resources manually in "
                "Settings > Dashboards > Resources:",
                max_attempts,
            )
            for url in urls:
                _LOGGER.warning("  URL: %s  |  Type: JavaScript Module", url)

        if hass.state == CoreState.running:
            await _register_with_retry()
        else:
            hass.bus.async_listen_once(
                EVENT_HOMEASSISTANT_STARTED, _register_with_retry
            )

    except Exception as err:
        _LOGGER.error("Failed to register resources: %s", err)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Favorites from a config entry."""
    store = FavoritesStore(hass)
    await store.async_load()

    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][entry.entry_id] = store
    hass.data[DOMAIN]["store"] = store

    await async_register_services(hass, store)
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    
    # Register Lovelace resources (static path already registered in async_setup)
    await async_register_resources(hass)

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unload_ok:
        hass.data[DOMAIN].pop(entry.entry_id)
    return unload_ok


async def async_register_services(hass: HomeAssistant, store: FavoritesStore) -> None:
    """Register services."""

    @callback
    def fire_changed_event(action: str, user_id: str, entity_id: str | None = None) -> None:
        """Fire event when favorites change."""
        hass.bus.async_fire(
            EVENT_FAVORITES_CHANGED,
            {
                "action": action,
                "user_id": user_id,
                "entity_id": entity_id,
                "favorites": store.get_user_entity_ids(user_id),
            },
        )

    async def handle_add(call: ServiceCall) -> None:
        user_id = call.data[ATTR_USER_ID]
        entity_id = call.data[ATTR_ENTITY_ID]
        custom_name = call.data.get(ATTR_CUSTOM_NAME)
        custom_icon = call.data.get(ATTR_CUSTOM_ICON)
        if await store.async_add(user_id, entity_id, custom_name, custom_icon):
            _LOGGER.info("Added %s to favorites for user %s", entity_id, user_id)
            fire_changed_event("add", user_id, entity_id)
            
            # Fire sync event for recently removed (in case we removed it from history)
            items = store.get_recently_removed_items(user_id)
            hass.bus.async_fire(
                EVENT_RECENTLY_REMOVED_CHANGED,
                {"action": "get", "user_id": user_id, "items": items},
            )

    async def handle_remove(call: ServiceCall) -> None:
        user_id = call.data[ATTR_USER_ID]
        entity_id = call.data[ATTR_ENTITY_ID]
        if await store.async_remove(user_id, entity_id):
            _LOGGER.info("Removed %s from favorites for user %s", entity_id, user_id)
            fire_changed_event("remove", user_id, entity_id)
            
            # Fire sync event for recently removed (we added to it)
            items = store.get_recently_removed_items(user_id)
            hass.bus.async_fire(
                EVENT_RECENTLY_REMOVED_CHANGED,
                {"action": "get", "user_id": user_id, "items": items},
            )

    async def handle_toggle(call: ServiceCall) -> None:
        user_id = call.data[ATTR_USER_ID]
        entity_id = call.data[ATTR_ENTITY_ID]
        is_fav = await store.async_toggle(user_id, entity_id)
        action = "add" if is_fav else "remove"
        _LOGGER.info("Toggled %s for user %s - now %s", entity_id, user_id, "favorited" if is_fav else "not favorited")
        fire_changed_event(action, user_id, entity_id)
        
        # Fire sync event for recently removed
        items = store.get_recently_removed_items(user_id)
        hass.bus.async_fire(
            EVENT_RECENTLY_REMOVED_CHANGED,
            {"action": "get", "user_id": user_id, "items": items},
        )

    async def handle_reorder(call: ServiceCall) -> None:
        user_id = call.data[ATTR_USER_ID]
        await store.async_reorder(user_id, call.data[ATTR_ENTITY_IDS])
        _LOGGER.info("Reordered favorites for user %s", user_id)
        fire_changed_event("reorder", user_id, None)

    async def handle_clear(call: ServiceCall) -> None:
        user_id = call.data[ATTR_USER_ID]
        await store.async_clear(user_id)
        _LOGGER.info("Cleared all favorites for user %s", user_id)
        fire_changed_event("clear", user_id, None)

    async def handle_update(call: ServiceCall) -> None:
        user_id = call.data[ATTR_USER_ID]
        entity_id = call.data[ATTR_ENTITY_ID]
        custom_name = call.data.get(ATTR_CUSTOM_NAME)
        if await store.async_update(user_id, entity_id, custom_name):
            _LOGGER.info("Updated %s for user %s - name: %s", entity_id, user_id, custom_name or "(default)")
            fire_changed_event("update", user_id, entity_id)

    async def handle_restore(call: ServiceCall) -> None:
        user_id = call.data[ATTR_USER_ID]
        entity_id = call.data[ATTR_ENTITY_ID]
        if await store.async_restore(user_id, entity_id):
            _LOGGER.info("Restored %s to favorites for user %s", entity_id, user_id)
            fire_changed_event("restore", user_id, entity_id)
            
            # Fire sync event for recently removed
            items = store.get_recently_removed_items(user_id)
            hass.bus.async_fire(
                EVENT_RECENTLY_REMOVED_CHANGED,
                {
                    "action": "get", 
                    "user_id": user_id, 
                    "items": items
                },
            )

    async def handle_set_entity_theme(call: ServiceCall) -> None:
        user_id = call.data[ATTR_USER_ID]
        entity_id = call.data[ATTR_ENTITY_ID]
        theme = call.data.get(ATTR_THEME)
        if await store.async_set_entity_theme(user_id, entity_id, theme):
            _LOGGER.info("Set theme for %s to %s for user %s", entity_id, theme or "(default)", user_id)
            fire_changed_event("theme_update", user_id, entity_id)

    async def handle_clear_recently_removed(call: ServiceCall) -> None:
        user_id = call.data[ATTR_USER_ID]
        await store.async_clear_recently_removed(user_id)
        _LOGGER.info("Cleared recently removed for user %s", user_id)
        hass.bus.async_fire(
            EVENT_RECENTLY_REMOVED_CHANGED,
            {"action": "clear", "user_id": user_id},
        )

    async def handle_get_recently_removed(call: ServiceCall) -> None:
        user_id = call.data[ATTR_USER_ID]
        items = store.get_recently_removed_items(user_id)
        # Fire event with current list so frontend can update
        hass.bus.async_fire(
            EVENT_RECENTLY_REMOVED_CHANGED,
            {
                "action": "get", 
                "user_id": user_id, 
                "items": items
            },
        )

    hass.services.async_register(
        DOMAIN, SERVICE_ADD, handle_add,
        schema=vol.Schema({
            vol.Required(ATTR_USER_ID): cv.string,
            vol.Required(ATTR_ENTITY_ID): cv.entity_id,
            vol.Optional(ATTR_CUSTOM_NAME): cv.string,
            vol.Optional(ATTR_CUSTOM_ICON): cv.icon,
        }),
    )

    hass.services.async_register(
        DOMAIN, SERVICE_REMOVE, handle_remove,
        schema=vol.Schema({
            vol.Required(ATTR_USER_ID): cv.string,
            vol.Required(ATTR_ENTITY_ID): cv.entity_id,
        }),
    )

    hass.services.async_register(
        DOMAIN, SERVICE_TOGGLE, handle_toggle,
        schema=vol.Schema({
            vol.Required(ATTR_USER_ID): cv.string,
            vol.Required(ATTR_ENTITY_ID): cv.entity_id,
        }),
    )

    hass.services.async_register(
        DOMAIN, SERVICE_REORDER, handle_reorder,
        schema=vol.Schema({
            vol.Required(ATTR_USER_ID): cv.string,
            vol.Required(ATTR_ENTITY_IDS): cv.ensure_list,
        }),
    )

    hass.services.async_register(
        DOMAIN, SERVICE_CLEAR, handle_clear,
        schema=vol.Schema({
            vol.Required(ATTR_USER_ID): cv.string,
        }),
    )

    hass.services.async_register(
        DOMAIN, SERVICE_UPDATE, handle_update,
        schema=vol.Schema({
            vol.Required(ATTR_USER_ID): cv.string,
            vol.Required(ATTR_ENTITY_ID): cv.entity_id,
            vol.Optional(ATTR_CUSTOM_NAME): vol.Any(cv.string, None),
        }),
    )

    hass.services.async_register(
        DOMAIN, SERVICE_RESTORE, handle_restore,
        schema=vol.Schema({
            vol.Required(ATTR_USER_ID): cv.string,
            vol.Required(ATTR_ENTITY_ID): cv.entity_id,
        }),
    )

    hass.services.async_register(
        DOMAIN, SERVICE_SET_ENTITY_THEME, handle_set_entity_theme,
        schema=vol.Schema({
            vol.Required(ATTR_USER_ID): cv.string,
            vol.Required(ATTR_ENTITY_ID): cv.entity_id,
            vol.Optional(ATTR_THEME): vol.Any(cv.string, None),
        }),
    )

    hass.services.async_register(
        DOMAIN, SERVICE_CLEAR_RECENTLY_REMOVED, handle_clear_recently_removed,
        schema=vol.Schema({
            vol.Required(ATTR_USER_ID): cv.string,
        }),
    )

    hass.services.async_register(
        DOMAIN, SERVICE_GET_RECENTLY_REMOVED, handle_get_recently_removed,
        schema=vol.Schema({
            vol.Required(ATTR_USER_ID): cv.string,
        }),
    )

    # ================================================================
    # ADMIN SERVICE HANDLERS
    # ================================================================

    async def handle_admin_get_all(call: ServiceCall) -> None:
        """Get all users' favorites data."""
        data = store.get_all_users_favorites()
        data["activity_log"] = store.get_activity_log()
        hass.bus.async_fire(EVENT_ADMIN_DATA, data)
        _LOGGER.info("Admin: fetched all users' favorites data")

    async def handle_admin_add_default(call: ServiceCall) -> None:
        """Admin: add an entity to all or specific users."""
        entity_id = call.data[ATTR_ENTITY_ID]
        target_user_ids = call.data.get(ATTR_TARGET_USER_IDS)
        custom_name = call.data.get(ATTR_CUSTOM_NAME)
        affected = await store.async_admin_add_default(
            entity_id, target_user_ids, custom_name
        )
        for uid in affected:
            fire_changed_event("add", uid, entity_id)
        _LOGGER.info(
            "Admin: added default %s to %d users", entity_id, len(affected)
        )

    async def handle_admin_remove_entity(call: ServiceCall) -> None:
        """Admin: remove an entity from specific users."""
        entity_id = call.data[ATTR_ENTITY_ID]
        target_user_ids = call.data[ATTR_TARGET_USER_IDS]
        affected = await store.async_admin_remove_entity(
            entity_id, target_user_ids
        )
        for uid in affected:
            fire_changed_event("remove", uid, entity_id)
        _LOGGER.info(
            "Admin: removed %s from %d users", entity_id, len(affected)
        )

    async def handle_admin_reorder(call: ServiceCall) -> None:
        """Admin: reorder favorites for a specific user."""
        user_id = call.data[ATTR_USER_ID]
        entity_ids = call.data[ATTR_ENTITY_IDS]
        await store.async_reorder(user_id, entity_ids, bypass_lock=True)
        _LOGGER.info("Admin: reordered favorites for user %s", user_id)
        fire_changed_event("reorder", user_id, None)

    async def handle_admin_clone(call: ServiceCall) -> None:
        """Admin: clone favorites from one user to another."""
        source_user_id = call.data[ATTR_SOURCE_USER_ID]
        target_user_id = call.data[ATTR_TARGET_USER_ID]
        if await store.async_admin_clone(source_user_id, target_user_id):
            _LOGGER.info(
                "Admin: cloned favorites from %s to %s",
                source_user_id,
                target_user_id,
            )
            fire_changed_event("clone", target_user_id, None)

    async def handle_admin_set_entity_lock(call: ServiceCall) -> None:
        """Admin: lock/unlock an entity for a user."""
        user_id = call.data[ATTR_USER_ID]
        entity_id = call.data[ATTR_ENTITY_ID]
        locked = call.data[ATTR_LOCKED]
        if await store.async_set_entity_lock(user_id, entity_id, locked):
            action = "locked" if locked else "unlocked"
            _LOGGER.info(
                "Admin: %s entity %s for user %s", action, entity_id, user_id
            )
            fire_changed_event("lock_update", user_id, entity_id)

    async def handle_admin_set_user_lock(call: ServiceCall) -> None:
        """Admin: lock/unlock a user's ability to modify favorites."""
        user_id = call.data[ATTR_USER_ID]
        locked = call.data[ATTR_LOCKED]
        if await store.async_set_user_lock(user_id, locked):
            action = "locked" if locked else "unlocked"
            _LOGGER.info("Admin: %s user %s", action, user_id)
            fire_changed_event("user_lock_update", user_id, None)

    async def handle_admin_save_preset(call: ServiceCall) -> None:
        """Admin: save a named preset."""
        name = call.data[ATTR_NAME]
        entity_ids = call.data[ATTR_ENTITY_IDS]
        await store.async_save_preset(name, entity_ids)
        _LOGGER.info("Admin: saved preset '%s' with %d entities", name, len(entity_ids))

    async def handle_admin_apply_preset(call: ServiceCall) -> None:
        """Admin: apply a preset to all or specific users."""
        name = call.data[ATTR_NAME]
        target_user_ids = call.data.get(ATTR_TARGET_USER_IDS)
        affected = await store.async_apply_preset(name, target_user_ids)
        for uid in affected:
            fire_changed_event("preset_apply", uid, None)
        _LOGGER.info(
            "Admin: applied preset '%s' to %d users", name, len(affected)
        )

    async def handle_admin_delete_preset(call: ServiceCall) -> None:
        """Admin: delete a saved preset."""
        name = call.data[ATTR_NAME]
        if await store.async_delete_preset(name):
            _LOGGER.info("Admin: deleted preset '%s'", name)

    # ================================================================
    # ADMIN SERVICE REGISTRATIONS
    # ================================================================

    hass.services.async_register(
        DOMAIN, SERVICE_ADMIN_GET_ALL, handle_admin_get_all,
        schema=vol.Schema({}),
    )

    hass.services.async_register(
        DOMAIN, SERVICE_ADMIN_ADD_DEFAULT, handle_admin_add_default,
        schema=vol.Schema({
            vol.Required(ATTR_ENTITY_ID): cv.entity_id,
            vol.Optional(ATTR_TARGET_USER_IDS): cv.ensure_list,
            vol.Optional(ATTR_CUSTOM_NAME): cv.string,
        }),
    )

    hass.services.async_register(
        DOMAIN, SERVICE_ADMIN_REMOVE_ENTITY, handle_admin_remove_entity,
        schema=vol.Schema({
            vol.Required(ATTR_ENTITY_ID): cv.entity_id,
            vol.Required(ATTR_TARGET_USER_IDS): cv.ensure_list,
        }),
    )

    hass.services.async_register(
        DOMAIN, SERVICE_ADMIN_REORDER, handle_admin_reorder,
        schema=vol.Schema({
            vol.Required(ATTR_USER_ID): cv.string,
            vol.Required(ATTR_ENTITY_IDS): cv.ensure_list,
        }),
    )

    hass.services.async_register(
        DOMAIN, SERVICE_ADMIN_CLONE, handle_admin_clone,
        schema=vol.Schema({
            vol.Required(ATTR_SOURCE_USER_ID): cv.string,
            vol.Required(ATTR_TARGET_USER_ID): cv.string,
        }),
    )

    hass.services.async_register(
        DOMAIN, SERVICE_ADMIN_SET_ENTITY_LOCK, handle_admin_set_entity_lock,
        schema=vol.Schema({
            vol.Required(ATTR_USER_ID): cv.string,
            vol.Required(ATTR_ENTITY_ID): cv.entity_id,
            vol.Required(ATTR_LOCKED): cv.boolean,
        }),
    )

    hass.services.async_register(
        DOMAIN, SERVICE_ADMIN_SET_USER_LOCK, handle_admin_set_user_lock,
        schema=vol.Schema({
            vol.Required(ATTR_USER_ID): cv.string,
            vol.Required(ATTR_LOCKED): cv.boolean,
        }),
    )

    hass.services.async_register(
        DOMAIN, SERVICE_ADMIN_SAVE_PRESET, handle_admin_save_preset,
        schema=vol.Schema({
            vol.Required(ATTR_NAME): cv.string,
            vol.Required(ATTR_ENTITY_IDS): cv.ensure_list,
        }),
    )

    hass.services.async_register(
        DOMAIN, SERVICE_ADMIN_APPLY_PRESET, handle_admin_apply_preset,
        schema=vol.Schema({
            vol.Required(ATTR_NAME): cv.string,
            vol.Optional(ATTR_TARGET_USER_IDS): cv.ensure_list,
        }),
    )

    hass.services.async_register(
        DOMAIN, SERVICE_ADMIN_DELETE_PRESET, handle_admin_delete_preset,
        schema=vol.Schema({
            vol.Required(ATTR_NAME): cv.string,
        }),
    )