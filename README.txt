Favorites – Home Assistant Custom Component

This custom component adds a favorites system to Home Assistant dashboards.

It allows users to mark any existing card as a favorite using a star button, then automatically collect those favorites into a dedicated Favorites Grid card.
The favorites grid can live in the same view, a different view, or an entirely different dashboard.

The goal is simple:
quick access to important entities without duplicating cards manually.

How It Works

A favoritable layout card wraps existing cards and displays a star button.

When the star is toggled ON, that card is added to the favorites list.

A favorites grid card displays all favorited items dynamically.

Removing the star immediately removes the item from the grid.

No dashboard reloads, no manual duplication.

Requirements

This project includes two custom Lovelace cards:

favoritable-card.js
Adds a star button to any existing card.

favorites-grid-card.js
Displays all favorited items in a grid layout.

Both cards are required for full functionality.

Installation (Custom Component)

On your Home Assistant server, go to:

/config/custom_components/

Create a new folder named:

Favorites

Upload all integration files into that folder.

Restart Home Assistant.

Go to:
Settings → Devices & Services

Click Add Integration (bottom right).

Search for Favorites, submit, and confirm.

Installing the Custom Cards

For each card file (favoritable-card.js, favorites-grid-card.js):

Create the file in:

/config/www/card_name.js

Paste the card’s JavaScript code into the file.

Go to:
Settings → Dashboards → three dots (top right) → Resources

Click Add Resource.

Add the path:

/local/card_name.js

Set type to JavaScript Module and save.

Favorites Grid Card Configuration

Add the Favorites Grid card to any dashboard or view.

Example configuration:

type: custom:favorites-grid-card
title: Favorites
columns: 2
show_empty_message: true
empty_message: No favorites yet!
card_style: tile
light_compact: true
allow_reorder: true

Save the card.

Adding a Star to Existing Cards

Wrap any existing card using the Favoritable Card.

Example configuration:

type: custom:favoritable-card
entity:
button_position: top-right
button_size: 29px
card:
type: YOUR_EXISTING_CARD

Replace YOUR_EXISTING_CARD with the card you already use
(button-card, tile, entity card, etc.).

Save the card.
The star will appear immediately.

Notes

The favorites grid can be placed anywhere (same view, different view, or another dashboard).

Favorited items persist across dashboard reloads.

No entity duplication is required.
