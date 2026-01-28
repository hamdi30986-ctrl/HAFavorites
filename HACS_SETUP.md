# HACS Setup Guide

This document explains how to prepare this integration for HACS submission.

## Repository Structure

When uploading to GitHub, your repository structure should be:

```
hafavorites/
├── custom_components/
│   └── favorites/
│       ├── __init__.py
│       ├── binary_sensor.py
│       ├── config_flow.py
│       ├── const.py
│       ├── manifest.json
│       ├── sensor.py
│       ├── services.yaml
│       └── strings.json
├── cards/
│   ├── favoritable-card.js
│   └── favorites-grid-card.js
├── hacs.json
├── info.md
├── README.md
└── LICENSE (optional but recommended)
```

## Important Notes

1. **Directory Structure**: All integration files must be in `custom_components/favorites/` directory
2. **hacs.json**: Already created in root
3. **README.md**: Already updated with comprehensive documentation
4. **info.md**: Created for HACS description
5. **manifest.json**: Fixed and validated

## HACS Submission Checklist

- [x] `hacs.json` file in root
- [x] `README.md` with comprehensive documentation
- [x] `info.md` for HACS description
- [x] `manifest.json` with all required fields
- [ ] All files in `custom_components/favorites/` directory
- [ ] Cards in `cards/` directory (or document where to get them)
- [ ] LICENSE file (recommended)
- [ ] GitHub releases (for version tracking)

## Cards Installation

The custom cards (`favoritable-card.js` and `favorites-grid-card.js`) need to be:
1. Either included in the repository (in `cards/` directory)
2. Or documented where users can download them
3. Or made available as separate HACS repositories

Currently, they're in the `cards/` directory. Users will need to manually copy them to `/config/www/` and add them as resources.

## Next Steps

1. Create GitHub repository
2. Upload files with correct directory structure
3. Create initial release
4. Submit to HACS (if desired) or users can add as custom repository

## HACS Custom Repository

Users can add this as a custom repository in HACS:
1. HACS → Integrations → ⋮ → Custom repositories
2. Add: `https://github.com/hamdi30986-ctrl/hafavorites`
3. Category: Integration
4. Install
