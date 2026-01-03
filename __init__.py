"""
Favorites Integration for Home Assistant.
Provides a HomeKit-like favorites system with per-user support.
"""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant, ServiceCall, callback
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.storage import Store
from homeassistant.helpers.typing import ConfigType

_LOGGER = logging.getLogger(__name__)

DOMAIN = "favorites"
STORAGE_VERSION = 1  # Keep at 1, handle migration internally
STORAGE_KEY = DOMAIN

PLATFORMS: list[Platform] = [Platform.SENSOR, Platform.BINARY_SENSOR]

# Service constants
SERVICE_ADD = "add"
SERVICE_REMOVE = "remove"
SERVICE_TOGGLE = "toggle"
SERVICE_REORDER = "reorder"
SERVICE_CLEAR = "clear"
SERVICE_UPDATE = "update"

ATTR_ENTITY_ID = "entity_id"
ATTR_USER_ID = "user_id"
ATTR_CUSTOM_NAME = "custom_name"
ATTR_CUSTOM_ICON = "custom_icon"
ATTR_ENTITY_IDS = "entity_ids"

EVENT_FAVORITES_CHANGED = "favorites_changed"


class FavoritesStore:
    """Manage favorites storage with per-user support."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize the store."""
        self.hass = hass
        self._store: Store = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self._data: dict[str, Any] = {"users": {}}

    async def async_load(self) -> None:
        """Load data from storage."""
        data = await self._store.async_load()
        if data:
            # Migration: convert old format to new format
            if "items" in data and "users" not in data:
                _LOGGER.info("Migrating favorites to per-user format")
                # Store old items under a default key - user can re-favorite them
                self._data = {"users": {"migrated_default": data["items"]}}
                # Save migrated data
                await self.async_save()
            elif "users" in data:
                self._data = data
            else:
                self._data = {"users": {}}
        else:
            self._data = {"users": {}}

    async def async_save(self) -> None:
        """Save data to storage."""
        await self._store.async_save(self._data)

    @property
    def users(self) -> dict[str, list[dict[str, Any]]]:
        """Return the full users dict (copy to avoid reference issues)."""
        return dict(self._data.get("users", {}))

    def get_user_items(self, user_id: str) -> list[dict[str, Any]]:
        """Return the list of favorite items for a specific user."""
        return self._data.get("users", {}).get(user_id, [])

    def get_user_entity_ids(self, user_id: str) -> list[str]:
        """Return list of favorited entity IDs for a specific user."""
        return [item["entity_id"] for item in self.get_user_items(user_id)]

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
    ) -> bool:
        """Add an entity to favorites for a specific user."""
        if self.is_favorite(user_id, entity_id):
            return False

        # Ensure user exists in data
        if user_id not in self._data["users"]:
            self._data["users"][user_id] = []

        # Get area from entity registry if available
        area_id = None
        try:
            entity_registry = er.async_get(self.hass)
            if entry := entity_registry.async_get(entity_id):
                area_id = entry.area_id
        except Exception:
            pass  # Area ID is optional, continue without it

        user_items = self.get_user_items(user_id)
        new_item = {
            "entity_id": entity_id,
            "added_at": datetime.now().isoformat(),
            "order": len(user_items),
            "custom_name": custom_name,
            "custom_icon": custom_icon,
            "area_id": area_id,
        }

        # Create NEW dict objects to ensure Home Assistant detects the change
        new_user_items = [*user_items, new_item]
        self._data["users"] = {**self._data.get("users", {}), user_id: new_user_items}
        await self.async_save()
        return True

    async def async_remove(self, user_id: str, entity_id: str) -> bool:
        """Remove an entity from favorites for a specific user."""
        if user_id not in self._data["users"]:
            return False

        user_items = self.get_user_items(user_id)
        original_length = len(user_items)
        new_items = [item for item in user_items if item["entity_id"] != entity_id]

        if len(new_items) < original_length:
            for i, item in enumerate(new_items):
                item["order"] = i
            # Create NEW dict to ensure HA detects the change
            self._data["users"] = {**self._data.get("users", {}), user_id: new_items}
            await self.async_save()
            return True
        return False

    async def async_toggle(self, user_id: str, entity_id: str) -> bool:
        """Toggle favorite status for a specific user."""
        if self.is_favorite(user_id, entity_id):
            await self.async_remove(user_id, entity_id)
            return False
        else:
            await self.async_add(user_id, entity_id)
            return True

    async def async_reorder(self, user_id: str, entity_ids: list[str]) -> None:
        """Reorder favorites based on provided entity_id list for a specific user."""
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

        # Create NEW dict to ensure HA detects the change
        self._data["users"] = {**self._data.get("users", {}), user_id: new_items}
        await self.async_save()

    async def async_clear(self, user_id: str) -> None:
        """Clear all favorites for a specific user."""
        # Create NEW dict to ensure HA detects the change
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
                item["custom_name"] = custom_name  # None resets to default
                updated = True
                break
        
        if updated:
            # Create NEW dict to ensure HA detects the change
            self._data["users"] = {**self._data.get("users", {}), user_id: user_items}
            await self.async_save()
        
        return updated


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up from YAML (not used)."""
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Favorites from a config entry."""
    store = FavoritesStore(hass)
    await store.async_load()

    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][entry.entry_id] = store
    hass.data[DOMAIN]["store"] = store

    await async_register_services(hass, store)
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

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

    async def handle_remove(call: ServiceCall) -> None:
        user_id = call.data[ATTR_USER_ID]
        entity_id = call.data[ATTR_ENTITY_ID]
        if await store.async_remove(user_id, entity_id):
            _LOGGER.info("Removed %s from favorites for user %s", entity_id, user_id)
            fire_changed_event("remove", user_id, entity_id)

    async def handle_toggle(call: ServiceCall) -> None:
        user_id = call.data[ATTR_USER_ID]
        entity_id = call.data[ATTR_ENTITY_ID]
        is_fav = await store.async_toggle(user_id, entity_id)
        action = "add" if is_fav else "remove"
        _LOGGER.info("Toggled %s for user %s - now %s", entity_id, user_id, "favorited" if is_fav else "not favorited")
        fire_changed_event(action, user_id, entity_id)

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
        custom_name = call.data.get(ATTR_CUSTOM_NAME)  # None means reset to default
        if await store.async_update(user_id, entity_id, custom_name):
            _LOGGER.info("Updated %s for user %s - name: %s", entity_id, user_id, custom_name or "(default)")
            fire_changed_event("update", user_id, entity_id)

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
