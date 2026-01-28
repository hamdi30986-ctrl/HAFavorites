# HAFavorites – Home Assistant Custom Integration

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/custom-components/hacs)

A Home Assistant custom integration that adds a **favorites system** to your dashboards, allowing you to quickly access important entities without duplicating cards manually.

![Favoritable Card](https://github.com/user-attachments/assets/84e2e64e-95f1-4e02-8f57-6565d4ecf509)

<img width="517" height="784" alt="image" src="https://github.com/user-attachments/assets/ed3cfd3b-1a71-4c99-8d04-5537f2de51f3" />

## ✨ Features

- **Visual Star Button** - Add favorites with a click
- **Native Hold-Action** - Use hold-action to add favorites (no wrapper needed)
- **Favorites Grid Card** - Beautiful grid display with multiple themes
- **Per-User Support** - Each user has their own favorites list
- **Multiple Themes** - Dark, Light, Liquid Glass, and Native themes
- **Real-time Updates** - Changes sync instantly
- **Entity Controls** - Built-in controls for lights, climate, covers
- **Custom Names** - Rename favorites with long-press
- **Drag & Drop** - Reorder favorites easily

## Installation

### HACS (Recommended)

1. Open HACS → **Integrations**
2. Click **⋮** → **Custom repositories**
3. Add repository: `https://github.com/hamdi30986-ctrl/HAFavorites`
4. Category: **Integration**
5. Install **HAFavorites**
6. Restart Home Assistant
7. Go to **Settings → Devices & Services → Add Integration**
8. Search for **Favorites** and configure

### Manual Installation

1. Download the latest release
2. Copy `custom_components/favorites` to `/config/custom_components/`
3. Restart Home Assistant
4. Add the integration via **Settings → Devices & Services**

## Custom Cards

The custom cards are **automatically installed and registered** when you set up the integration!

- Cards are automatically downloaded with the integration
- Resources are automatically added to Lovelace
- No manual setup required

If cards don't appear after installation, refresh your browser or restart Home Assistant.

## Adding Entities to Favorites

### Method 1: Favoritable Card (Visual Star) ⭐

Wrap any card with the favoritable-card:

```yaml
type: custom:favoritable-card
entity: light.living_room
button_position: top-right
card:
  type: entities
  entities:
    - light.living_room
```

### Method 2: Hold-Action (Native HA) 

Use Home Assistant's built-in hold-action:

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

## Favorites Grid Card

Add the grid card to display all favorites:

```yaml
type: custom:favorites-grid-card
title: Favorites
theme: dark  # dark, light, liquid, native
columns: 2
show_climate_controls: true
show_cover_controls: true
allow_reorder: true
```

### Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `title` | `"Favorites"` | Card title |
| `theme` | `"dark"` | Theme: `dark`, `light`, `liquid`, `native` |
| `columns` | `2` | Number of columns |
| `show_climate_controls` | `true` | Show climate controls |
| `show_cover_controls` | `true` | Show cover controls |
| `allow_reorder` | `true` | Enable drag-and-drop |

## Usage

- **Rename**: Long-press any favorite (4 seconds) to rename
- **Reorder**: Drag and drop items in the grid
- **Per-User**: Each user has their own favorites list

## Troubleshooting

**Star button not appearing?**
- Refresh your browser (cards are auto-registered)
- Check that the integration is configured
- Verify resources in **Settings → Dashboards → Resources**

**Favorites not showing?**
- Refresh your browser
- Check that the integration is configured
- Verify `sensor.favorites_list` exists in Developer Tools

**Hold-action not working?**
- Verify the card supports `hold_action`
- Check browser console for errors

## Support

- **Issues**: [GitHub Issues](https://github.com/hamdi30986-ctrl/hafavorites/issues)

---

**Made with ❤️ for the Home Assistant community**
