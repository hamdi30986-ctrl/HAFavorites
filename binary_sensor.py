"""Binary sensor platform for Favorites - provides template-friendly is_favorite check."""
from __future__ import annotations

import logging

from homeassistant.components.binary_sensor import BinarySensorEntity
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
    """Set up Favorites binary sensor from a config entry."""
    store: FavoritesStore = hass.data[DOMAIN]["store"]
    async_add_entities([FavoritesActiveSensor(store)], True)


class FavoritesActiveSensor(BinarySensorEntity):
    """Binary sensor that indicates if any favorites exist (across all users)."""

    _attr_has_entity_name = True
    _attr_name = "Has Favorites"
    _attr_unique_id = "favorites_has_items"
    _attr_icon = "mdi:star-check"

    def __init__(self, store: FavoritesStore) -> None:
        """Initialize the sensor."""
        self._store = store
        self._update_state()

    def _update_state(self) -> None:
        """Update the is_on state based on all users."""
        total = sum(len(items) for items in self._store.users.values())
        self._attr_is_on = total > 0

    async def async_added_to_hass(self) -> None:
        """Run when entity about to be added to hass."""
        await super().async_added_to_hass()

        @callback
        def async_favorites_changed(event) -> None:
            """Handle favorites changed event."""
            self._update_state()
            self.async_write_ha_state()

        self.async_on_remove(
            self.hass.bus.async_listen(
                EVENT_FAVORITES_CHANGED, async_favorites_changed
            )
        )

    async def async_update(self) -> None:
        """Update the sensor."""
        self._update_state()
