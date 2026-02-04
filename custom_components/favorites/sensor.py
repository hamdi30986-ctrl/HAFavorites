"""Sensor platform for Favorites integration."""
from __future__ import annotations

import logging
from typing import Any

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from . import DOMAIN, EVENT_FAVORITES_CHANGED, EVENT_RECENTLY_REMOVED_CHANGED, FavoritesStore

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    store: FavoritesStore = hass.data[DOMAIN]["store"]
    async_add_entities([
        FavoritesSensor(hass, store),
        RecentlyRemovedSensor(hass, store),
    ], True)


class FavoritesSensor(SensorEntity):

    _attr_has_entity_name = True
    _attr_name = "Favorites List"
    _attr_unique_id = "favorites_list"
    _attr_icon = "mdi:star"
    _attr_should_poll = False

    def __init__(self, hass: HomeAssistant, store: FavoritesStore) -> None:
        self._hass = hass
        self._store = store
        self._update_native_value()

    def _update_native_value(self) -> None:
        total = sum(len(items) for items in self._store.users.values())
        self._attr_native_value = total

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        import copy
        users = copy.deepcopy(self._store.users)
        total_count = sum(len(items) for items in users.values())
        
        return {
            "users": users,
            "count": total_count,
        }

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()

        @callback
        def async_favorites_changed(event) -> None:
            self._update_native_value()
            self.async_write_ha_state()

        self.async_on_remove(
            self._hass.bus.async_listen(
                EVENT_FAVORITES_CHANGED, async_favorites_changed
            )
        )

    async def async_update(self) -> None:
        self._update_native_value()


class RecentlyRemovedSensor(SensorEntity):
    """Sensor that tracks recently removed favorites (last 20)."""

    _attr_has_entity_name = True
    _attr_name = "Recently Removed"
    _attr_unique_id = "favorites_recently_removed"
    _attr_icon = "mdi:history"
    _attr_should_poll = False

    def __init__(self, hass: HomeAssistant, store: FavoritesStore) -> None:
        self._hass = hass
        self._store = store
        self._update_native_value()

    def _update_native_value(self) -> None:
        total = sum(len(items) for items in self._store.recently_removed.values())
        self._attr_native_value = total

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        import copy
        users = copy.deepcopy(self._store.recently_removed)
        total_count = sum(len(items) for items in users.values())
        
        return {
            "users": users,
            "count": total_count,
        }

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()

        @callback
        def async_recently_removed_changed(event) -> None:
            self._update_native_value()
            self.async_write_ha_state()

        # Listen to both events - removals affect this sensor
        self.async_on_remove(
            self._hass.bus.async_listen(
                EVENT_FAVORITES_CHANGED, async_recently_removed_changed
            )
        )
        self.async_on_remove(
            self._hass.bus.async_listen(
                EVENT_RECENTLY_REMOVED_CHANGED, async_recently_removed_changed
            )
        )

    async def async_update(self) -> None:
        self._update_native_value()

