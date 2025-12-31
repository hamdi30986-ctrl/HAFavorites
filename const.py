"""Constants for the Favorites integration."""

DOMAIN = "favorites"
STORAGE_VERSION = 1  # Keep at 1, migration handled internally
STORAGE_KEY = DOMAIN

# Services
SERVICE_ADD = "add"
SERVICE_REMOVE = "remove"
SERVICE_TOGGLE = "toggle"
SERVICE_REORDER = "reorder"
SERVICE_CLEAR = "clear"

# Attributes
ATTR_ENTITY_ID = "entity_id"
ATTR_USER_ID = "user_id"
ATTR_CUSTOM_NAME = "custom_name"
ATTR_CUSTOM_ICON = "custom_icon"
ATTR_ENTITY_IDS = "entity_ids"

# Events
EVENT_FAVORITES_CHANGED = "favorites_changed"
