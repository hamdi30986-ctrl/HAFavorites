"""Constants for the Favorites integration."""

DOMAIN = "favorites"
STORAGE_VERSION = 1
STORAGE_KEY = DOMAIN


SERVICE_ADD = "add"
SERVICE_REMOVE = "remove"
SERVICE_TOGGLE = "toggle"
SERVICE_REORDER = "reorder"
SERVICE_CLEAR = "clear"
SERVICE_UPDATE = "update"
SERVICE_RESTORE = "restore"
SERVICE_SET_ENTITY_THEME = "set_entity_theme"
SERVICE_CLEAR_RECENTLY_REMOVED = "clear_recently_removed"


ATTR_ENTITY_ID = "entity_id"
ATTR_USER_ID = "user_id"
ATTR_CUSTOM_NAME = "custom_name"
ATTR_CUSTOM_ICON = "custom_icon"
ATTR_ENTITY_IDS = "entity_ids"
ATTR_THEME = "theme"


EVENT_RECENTLY_REMOVED_CHANGED = "favorites_recently_removed_changed"


EVENT_FAVORITES_CHANGED = "favorites_changed"
