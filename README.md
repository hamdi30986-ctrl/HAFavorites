V1.1:
- Added Rename function to the entities inside the gird.
  * Click/Press & hold for 1.5sec to re-order entities.
  * Click/Press & Hold for 2sec, a rename popup appears to rename entities.

# Favorites – Home Assistant Custom Component

This custom component adds a **favorites system** to Home Assistant dashboards.

It allows users to mark any existing card as a favorite using a star button, then automatically collect those favorites into a dedicated **Favorites Grid** card.

<img width="515" height="268" alt="fav-reddit3" src="https://github.com/user-attachments/assets/1fa46d5d-1d0f-49cf-8fb8-a50eeee7f726" />
<img width="499" height="202" alt="fav-reddit2" src="https://github.com/user-attachments/assets/84e2e64e-95f1-4e02-8f57-6565d4ecf509" />

The favorites grid can live in the same view, a different view, or an entirely different dashboard.

The goal is simple:  
quick access to important entities without duplicating cards manually.

<img width="491" height="389" alt="fav-reddit1" src="https://github.com/user-attachments/assets/71471709-e678-4338-a3e6-72e6ab361509" />


## How It Works

- A favoritable layout card wraps existing cards and displays a star button.
- When the star is toggled ON, that card is added to the favorites list.
- A favorites grid card displays all favorited items dynamically.
- Removing the star immediately removes the item from the grid.

No dashboard reloads. No manual duplication.

---

## Requirements

This project includes two custom Lovelace cards:

- **favoritable-card.js**  
  Adds a star button to any existing card.

- **favorites-grid-card.js**  
  Displays all favorited items in a grid layout.

Both cards are required for full functionality.

---

## Installation (Custom Component)

1. Go to the following directory on your Home Assistant server:

   `/config/custom_components/`

2. Create a folder named:

   `Favorites`

3. Upload all integration files into that folder.

4. Restart Home Assistant.

5. Go to:
   **Settings → Devices & Services**

6. Click **Add Integration** (bottom right).

7. Search for **Favorites**, submit, and confirm.

---

## Installing the Custom Cards

For each card file (`favoritable-card.js`, `favorites-grid-card.js`):

1. Create the file in:

   `/config/www/card_name.js`

2. Paste the card JavaScript code into the file.

3. Go to:
   **Settings → Dashboards → three dots (top right) → Resources**

4. Click **Add Resource**.

5. Add the path:

   `/local/card_name.js`

6. Set the type to **JavaScript Module** and save.

---

## Favorites Grid Card Configuration

Add the Favorites Grid card to any dashboard or view.

Example configuration:

```yaml
type: custom:favorites-grid-card
title: Favorites
columns: 2
show_empty_message: true
empty_message: No favorites yet!
card_style: tile
light_compact: true
allow_reorder: true
```

---

## Adding a Star to Existing Cards

Wrap any existing card using the Favoritable Card.

Example configuration:

```yaml
type: custom:favoritable-card
entity:
button_position: top-right
button_size: 29px
card:
  type: YOUR_EXISTING_CARD
```

Replace `YOUR_EXISTING_CARD` with the card you already use  
(button-card, tile, entity card, etc.).

Save the card. The star will appear immediately.

---

## Notes

- The favorites grid can be placed anywhere (same view, different view, or another dashboard).
- Favorited items persist across dashboard reloads.
- No entity duplication is required.
