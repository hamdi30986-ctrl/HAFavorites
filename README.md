# HAFavorites – Home Assistant Custom Integration

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/custom-components/hacs)
[![GitHub release](https://img.shields.io/github/release/hamdi30986-ctrl/hafavorites.svg)](https://github.com/hamdi30986-ctrl/hafavorites/releases)

A Home Assistant custom integration that adds a **favorites system** to your dashboards, allowing you to quickly access important entities without duplicating cards manually.

![Favorites Grid](https://github.com/user-attachments/assets/1fa46d5d-1d0f-49cf-8fb8-a50eeee7f726)
![Favoritable Card](https://github.com/user-attachments/assets/84e2e64e-95f1-4e02-8f57-6565d4ecf509)
![Dashboard Example](https://github.com/user-attachments/assets/71471709-e678-4338-a3e6-72e6ab361509)

## ✨ Features

- ⭐ **Visual Star Button** - Add favorites with a click using the favoritable-card wrapper
- 🎯 **Native Hold-Action** - Use Home Assistant's built-in hold-action to add favorites (no wrapper needed)
- 📊 **Favorites Grid Card** - Beautiful grid display with multiple themes
- 👤 **Per-User Support** - Each user has their own favorites list
- 🎨 **Multiple Themes** - Dark Glass, Light Glass, Liquid Glass, and Native themes
- 🔄 **Real-time Updates** - Changes sync instantly across all cards
- 🎛️ **Entity Controls** - Built-in controls for lights, climate, covers, and more
- 📝 **Custom Names** - Rename favorites with long-press (4 seconds)
- 🔀 **Drag & Drop** - Reorder favorites easily
- 🌈 **Card-Mod Compatible** - Works with card-mod for custom styling

## 📋 Requirements

- Home Assistant 2023.1.0 or higher
- HACS (recommended) or manual installation
- Two custom Lovelace cards (included):
  - `favoritable-card.js` - Adds star button to cards
  - `favorites-grid-card.js` - Displays favorites grid

---

## 🚀 Installation

### Method 1: HACS (Recommended)

1. Open HACS in Home Assistant
2. Go to **Integrations**
3. Click the three dots (⋮) in the top right
4. Select **Custom repositories**
5. Add repository:
   - **Repository**: `https://github.com/hamdi30986-ctrl/hafavorites`
   - **Category**: Integration
6. Click **Add**
7. Search for **HAFavorites** and install
8. Restart Home Assistant
9. Go to **Settings → Devices & Services → Add Integration**
10. Search for **Favorites** and configure

### Method 2: Manual Installation

1. Download the latest release from GitHub
2. Copy the `favorites` folder to `/config/custom_components/`
3. Restart Home Assistant
4. Go to **Settings → Devices & Services → Add Integration**
5. Search for **Favorites** and configure

---

## 📦 Installing the Custom Cards

After installing the integration, you need to add the custom cards:

### Option A: Via HACS (if available)

If the cards are available in HACS, install them from there.

### Option B: Manual Installation

1. Copy `favoritable-card.js` and `favorites-grid-card.js` to `/config/www/`
2. Go to **Settings → Dashboards → Resources** (three dots menu)
3. Click **Add Resource**
4. For each card:
   - **URL**: `/local/favoritable-card.js` (or `favorites-grid-card.js`)
   - **Resource Type**: JavaScript Module
5. Click **Create** and refresh your browser

---

## 🎯 Adding Entities to Favorites

You have **two methods** to add entities to favorites:

### Method 1: Using Favoritable Card (Visual Star Button) ⭐

Wrap any existing card with the favoritable-card to add a visual star button:

```yaml
type: custom:favoritable-card
entity: light.living_room
button_position: top-right  # top-right, top-left, bottom-right, bottom-left
button_size: 24px
card:
  type: entities  # or button-card, tile-card, etc.
  entities:
    - light.living_room
```

**Advantages:**
- ✅ Visual star indicator (filled = favorited, outline = not favorited)
- ✅ Easy to discover - users see the star button
- ✅ Visual feedback with animation
- ✅ Works with any card type

**Example with different card types:**

```yaml
# With button-card
type: custom:favoritable-card
entity: switch.kitchen
card:
  type: custom:button-card
  entity: switch.kitchen
  name: Kitchen Light

# With tile-card
type: custom:favoritable-card
entity: climate.thermostat
card:
  type: tile
  entity: climate.thermostat
```

### Method 2: Using Hold-Action (Native HA) 🎯

Use Home Assistant's built-in `hold_action` to add favorites without a wrapper:

```yaml
type: entities
entities:
  - entity: light.living_room
    hold_action:
      action: call-service
      service: favorites.toggle
      service_data:
        entity_id: light.living_room
        user_id: "{{ user.id }}"
```

**Advantages:**
- ✅ No wrapper card needed
- ✅ Native Home Assistant functionality
- ✅ Simpler configuration
- ✅ Works with most card types

**Example with different card types:**

```yaml
# With entities card
type: entities
entities:
  - entity: light.living_room
    hold_action:
      action: call-service
      service: favorites.toggle
      service_data:
        entity_id: light.living_room
        user_id: "{{ user.id }}"

# With button-card
type: custom:button-card
entity: switch.kitchen
hold_action:
  action: call-service
  service: favorites.toggle
  service_data:
    entity_id: switch.kitchen
    user_id: "{{ user.id }}"

# With tile-card (HA 2024.1+)
type: tile
entity: climate.thermostat
hold_action:
  action: call-service
  service: favorites.toggle
  service_data:
    entity_id: climate.thermostat
    user_id: "{{ user.id }}"
```

**Note:** The `{{ user.id }}` template automatically gets the current user's ID.

---

## 📊 Favorites Grid Card Configuration

Add the Favorites Grid card to display all your favorites:

```yaml
type: custom:favorites-grid-card
title: Favorites
theme: dark  # dark, light, liquid, native
columns: 2
show_empty_message: true
empty_message: No favorites yet!
show_climate_controls: true
show_cover_controls: true
light_compact: true
allow_reorder: true
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `title` | string | `"Favorites"` | Card title |
| `theme` | string | `"dark"` | Theme: `dark`, `light`, `liquid`, `native` |
| `columns` | number | `2` | Number of columns in grid |
| `show_empty_message` | boolean | `true` | Show message when no favorites |
| `empty_message` | string | `"No favorites yet!"` | Message when empty |
| `show_climate_controls` | boolean | `true` | Show climate temperature controls |
| `show_cover_controls` | boolean | `true` | Show cover open/close controls |
| `light_compact` | boolean | `true` | Use compact layout for lights |
| `allow_reorder` | boolean | `true` | Enable drag-and-drop reordering |
| `card_mod` | object | - | Card-mod styling (optional) |

### Theme Examples

```yaml
# Dark Glass Theme (default)
type: custom:favorites-grid-card
theme: dark

# Light Glass Theme
type: custom:favorites-grid-card
theme: light

# Liquid Glass Theme (high transparency)
type: custom:favorites-grid-card
theme: liquid

# Native Home Assistant Theme
type: custom:favorites-grid-card
theme: native
```

### Card-Mod Styling

You can use card-mod for additional styling:

```yaml
type: custom:favorites-grid-card
theme: dark
card_mod:
  style: |
    .card {
      background: rgba(0, 0, 0, 0.5) !important;
    }
```

---

## 🎮 Usage Tips

### Renaming Favorites

1. Long-press any favorite item in the grid (hold for 4 seconds)
2. A rename popup will appear
3. Enter your custom name
4. Click **Save** or press Enter
5. To reset to default, click **Reset to Default**

### Reordering Favorites

1. Drag and drop items in the favorites grid
2. The new order is saved automatically
3. Works on desktop and mobile (with touch support)

### Per-User Favorites

Each Home Assistant user has their own favorites list. The integration automatically:
- Detects the current user
- Shows only that user's favorites
- Saves favorites per user

---

## 🔧 Services

The integration provides several services:

### `favorites.toggle`

Toggle an entity's favorite status.

```yaml
service: favorites.toggle
data:
  entity_id: light.living_room
  user_id: "{{ user.id }}"
```

### `favorites.add`

Add an entity to favorites.

```yaml
service: favorites.add
data:
  entity_id: light.living_room
  user_id: "{{ user.id }}"
  custom_name: "Living Room Light"  # Optional
  custom_icon: "mdi:lightbulb"     # Optional
```

### `favorites.remove`

Remove an entity from favorites.

```yaml
service: favorites.remove
data:
  entity_id: light.living_room
  user_id: "{{ user.id }}"
```

### `favorites.update`

Update a favorite's custom name or icon.

```yaml
service: favorites.update
data:
  entity_id: light.living_room
  user_id: "{{ user.id }}"
  custom_name: "New Name"  # Set to null to reset
```

### `favorites.reorder`

Reorder favorites.

```yaml
service: favorites.reorder
data:
  user_id: "{{ user.id }}"
  entity_ids:
    - light.living_room
    - switch.kitchen
    - climate.thermostat
```

### `favorites.clear`

Clear all favorites for a user.

```yaml
service: favorites.clear
data:
  user_id: "{{ user.id }}"
```

---

## 📊 Sensor

The integration creates a sensor: `sensor.favorites_list`

**State:** Total number of favorites (across all users)

**Attributes:**
- `users`: Dictionary of all users' favorites
- `count`: Total count of favorites

You can access a specific user's favorites:

```yaml
{{ state_attr('sensor.favorites_list', 'users')[user.id] }}
```

---

## 🎨 Examples

### Complete Dashboard Example

```yaml
type: vertical-stack
cards:
  # Favorites Grid
  - type: custom:favorites-grid-card
    title: My Favorites
    theme: dark
    columns: 3
    
  # Regular cards with favoritable wrapper
  - type: custom:favoritable-card
    entity: light.living_room
    card:
      type: entities
      entities:
        - light.living_room
        - switch.kitchen
        - climate.thermostat
```

### Using Hold-Action in Entities Card

```yaml
type: entities
title: Living Room
entities:
  - entity: light.living_room
    hold_action:
      action: call-service
      service: favorites.toggle
      service_data:
        entity_id: light.living_room
        user_id: "{{ user.id }}"
  - entity: switch.kitchen
    hold_action:
      action: call-service
      service: favorites.toggle
      service_data:
        entity_id: switch.kitchen
        user_id: "{{ user.id }}"
```

---

## 🐛 Troubleshooting

### Star button not appearing

- Make sure `favoritable-card.js` is installed and added as a resource
- Check browser console for errors
- Refresh the page after adding the resource

### Favorites not showing in grid

- Make sure `favorites-grid-card.js` is installed and added as a resource
- Check that the integration is configured
- Verify `sensor.favorites_list` exists in Developer Tools → States

### Hold-action not working

- Verify the card type supports `hold_action`
- Check that `user_id` template is correct: `"{{ user.id }}"`
- Check browser console for errors

### User ID issues

- The `{{ user.id }}` template should work automatically
- If not, you can get your user ID from Developer Tools → States → `sensor.favorites_list` → Attributes → `users`

---

## 📝 Changelog

### Version 1.1
- Added rename function (long-press for 4 seconds)
- Added drag-and-drop reordering
- Improved theme support
- Added card-mod compatibility

### Version 1.0
- Initial release
- Per-user favorites support
- Favoritable card wrapper
- Favorites grid card
- Multiple themes

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- Home Assistant community
- All contributors and testers

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/hamdi30986-ctrl/hafavorites/issues)
- **Documentation**: [GitHub Wiki](https://github.com/hamdi30986-ctrl/hafavorites/wiki)

---

## ⚠️ Important Notes

- The favorites grid can be placed anywhere (same view, different view, or another dashboard)
- Favorited items persist across dashboard reloads
- No entity duplication is required
- Each user has their own favorites list
- The integration uses local storage (no cloud dependency)

---

**Made with ❤️ for the Home Assistant community**
