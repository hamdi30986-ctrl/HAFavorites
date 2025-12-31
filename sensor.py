"""Sensor platform for Favorites integration."""
from __future__ import annotations

import logging
from typing import Any

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from . import DOMAIN, EVENT_FAVORITES_CHANGED, FavoritesStore

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up Favorites sensor from a config entry."""
    store: FavoritesStore = hass.data[DOMAIN]["store"]
    async_add_entities([FavoritesSensor(hass, store)], True)


class FavoritesSensor(SensorEntity):
    """Sensor that exposes the favorites list with per-user support."""

    _attr_has_entity_name = True
    _attr_name = "Favorites List"
    _attr_unique_id = "favorites_list"
    _attr_icon = "mdi:star"
    _attr_should_poll = False  # We use event-based updates

    def __init__(self, hass: HomeAssistant, store: FavoritesStore) -> None:
        """Initialize the sensor."""
        self._hass = hass
        self._store = store
        self._update_native_value()

    def _update_native_value(self) -> None:
        """Update the native value (total count across all users)."""
        total = sum(len(items) for items in self._store.users.values())
        self._attr_native_value = total

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return the state attributes."""
        # Deep copy to ensure HA sees new objects on each call
        import copy
        users = copy.deepcopy(self._store.users)
        total_count = sum(len(items) for items in users.values())
        
        return {
            "users": users,
            "count": total_count,
        }

    async def async_added_to_hass(self) -> None:
        """Run when entity about to be added to hass."""
        await super().async_added_to_hass()

        @callback
        def async_favorites_changed(event) -> None:
            """Handle favorites changed event."""
            self._update_native_value()
            self.async_write_ha_state()

        self.async_on_remove(
            self._hass.bus.async_listen(
                EVENT_FAVORITES_CHANGED, async_favorites_changed
            )
        )

    async def async_update(self) -> None:
        """Update the sensor."""
        self._update_native_value()
