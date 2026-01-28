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
    store: FavoritesStore = hass.data[DOMAIN]["store"]
    async_add_entities([FavoritesSensor(hass, store)], True)


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
