
class FavoritesGridCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
  }

  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 16px;
        }
        
        .editor-row {
          display: flex;
          flex-direction: column;
          margin-bottom: 16px;
        }
        
        .editor-row label {
          font-size: 12px;
          font-weight: 500;
          color: var(--primary-text-color);
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          opacity: 0.8;
        }
        
        .editor-row input,
        .editor-row select {
          padding: 10px 12px;
          border: 1px solid var(--divider-color, rgba(255,255,255,0.12));
          border-radius: 8px;
          background: var(--card-background-color, rgba(255,255,255,0.05));
          color: var(--primary-text-color);
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }
        
        .editor-row input:focus,
        .editor-row select:focus {
          border-color: var(--primary-color, #03a9f4);
        }
        
        .editor-row input[type="number"] {
          width: 80px;
        }
        
        .editor-row input[type="checkbox"] {
          width: 18px;
          height: 18px;
          margin-right: 8px;
        }
        
        .checkbox-row {
          flex-direction: row;
          align-items: center;
        }
        
        .checkbox-row label {
          margin-bottom: 0;
          text-transform: none;
          font-size: 14px;
        }
        
        .theme-selector {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        
        .theme-option {
          position: relative;
          padding: 14px 12px;
          border: 2px solid var(--divider-color, rgba(255,255,255,0.12));
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }
        
        .theme-option:hover {
          border-color: var(--primary-color, #03a9f4);
          background: rgba(3, 169, 244, 0.05);
        }
        
        .theme-option.selected {
          border-color: var(--primary-color, #03a9f4);
          background: rgba(3, 169, 244, 0.1);
        }
        
        .theme-option.selected::after {
          content: '✓';
          position: absolute;
          top: 6px;
          right: 8px;
          font-size: 12px;
          color: var(--primary-color, #03a9f4);
        }
        
        .theme-preview {
          width: 100%;
          height: 40px;
          border-radius: 8px;
          margin-bottom: 8px;
        }
        
        .theme-preview.dark {
          background: linear-gradient(135deg, rgba(25, 25, 28, 0.9), rgba(40, 40, 45, 0.8));
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
        }
        
        .theme-preview.light {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.85), rgba(240, 240, 245, 0.9));
          border: 1px solid rgba(0, 0, 0, 0.08);
        }
        
        .theme-preview.liquid {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05));
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(20px);
        }
        
        .theme-preview.native {
          background: var(--ha-card-background, var(--card-background-color, #fff));
          border: 1px solid var(--divider-color, rgba(0,0,0,0.12));
        }
        
        .theme-name {
          font-size: 12px;
          font-weight: 500;
          color: var(--primary-text-color);
        }
        
        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--primary-text-color);
          margin: 20px 0 12px 0;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--divider-color, rgba(255,255,255,0.1));
        }
        
        .section-title:first-child {
          margin-top: 0;
        }
      </style>
      
      <div class="section-title">Theme</div>
      <div class="theme-selector">
        <div class="theme-option ${this._config.theme === 'dark' || !this._config.theme ? 'selected' : ''}" data-theme="dark">
          <div class="theme-preview dark"></div>
          <div class="theme-name">Dark Glass</div>
        </div>
        <div class="theme-option ${this._config.theme === 'light' ? 'selected' : ''}" data-theme="light">
          <div class="theme-preview light"></div>
          <div class="theme-name">Light Glass</div>
        </div>
        <div class="theme-option ${this._config.theme === 'liquid' ? 'selected' : ''}" data-theme="liquid">
          <div class="theme-preview liquid"></div>
          <div class="theme-name">Liquid Glass</div>
        </div>
        <div class="theme-option ${this._config.theme === 'native' ? 'selected' : ''}" data-theme="native">
          <div class="theme-preview native"></div>
          <div class="theme-name">Native HA</div>
        </div>
      </div>
      
      <div class="section-title">General</div>
      
      <div class="editor-row">
        <label>Title</label>
        <input type="text" id="title" value="${this._config.title || 'Favorites'}" placeholder="Card title">
      </div>
      
      <div class="editor-row">
        <label>Columns</label>
        <input type="number" id="columns" value="${this._config.columns || 2}" min="1" max="6">
      </div>
      
      <div class="editor-row">
        <label>Empty Message</label>
        <input type="text" id="empty_message" value="${this._config.empty_message || 'No favorites yet!'}" placeholder="Message when empty">
      </div>
      
      <div class="section-title">Features</div>
      
      <div class="editor-row checkbox-row">
        <input type="checkbox" id="show_empty_message" ${this._config.show_empty_message !== false ? 'checked' : ''}>
        <label for="show_empty_message">Show empty message</label>
      </div>
      
      <div class="editor-row checkbox-row">
        <input type="checkbox" id="show_climate_controls" ${this._config.show_climate_controls !== false ? 'checked' : ''}>
        <label for="show_climate_controls">Show climate controls (full size)</label>
      </div>
      
      <div class="editor-row checkbox-row">
        <input type="checkbox" id="show_cover_controls" ${this._config.show_cover_controls !== false ? 'checked' : ''}>
        <label for="show_cover_controls">Show cover controls (full size)</label>
      </div>
      
      <div class="editor-row checkbox-row">
        <input type="checkbox" id="light_compact" ${this._config.light_compact !== false ? 'checked' : ''}>
        <label for="light_compact">Compact light cards</label>
      </div>
      
      <div class="editor-row checkbox-row">
        <input type="checkbox" id="climate_compact" ${this._config.climate_compact ? 'checked' : ''}>
        <label for="climate_compact">Compact climate cards (tap for popup)</label>
      </div>
      
      <div class="editor-row checkbox-row">
        <input type="checkbox" id="cover_compact" ${this._config.cover_compact ? 'checked' : ''}>
        <label for="cover_compact">Compact cover cards (tap for popup)</label>
      </div>
      
      <div class="editor-row checkbox-row">
        <input type="checkbox" id="allow_reorder" ${this._config.allow_reorder !== false ? 'checked' : ''}>
        <label for="allow_reorder">Allow drag-drop reorder</label>
      </div>
      
      <div class="section-title">Per-Category Themes</div>
      <p style="font-size: 11px; color: var(--secondary-text-color); margin: 0 0 12px 0;">Override global theme for specific entity types</p>
      
      <div class="editor-row">
        <label>Lights Theme</label>
        <select id="theme_lights">
          <option value="" ${!this._config.theme_lights ? 'selected' : ''}>Use global</option>
          <option value="dark" ${this._config.theme_lights === 'dark' ? 'selected' : ''}>Dark Glass</option>
          <option value="light" ${this._config.theme_lights === 'light' ? 'selected' : ''}>Light Glass</option>
          <option value="liquid" ${this._config.theme_lights === 'liquid' ? 'selected' : ''}>Liquid Glass</option>
          <option value="native" ${this._config.theme_lights === 'native' ? 'selected' : ''}>Native HA</option>
        </select>
      </div>
      
      <div class="editor-row">
        <label>Climate Theme</label>
        <select id="theme_climate">
          <option value="" ${!this._config.theme_climate ? 'selected' : ''}>Use global</option>
          <option value="dark" ${this._config.theme_climate === 'dark' ? 'selected' : ''}>Dark Glass</option>
          <option value="light" ${this._config.theme_climate === 'light' ? 'selected' : ''}>Light Glass</option>
          <option value="liquid" ${this._config.theme_climate === 'liquid' ? 'selected' : ''}>Liquid Glass</option>
          <option value="native" ${this._config.theme_climate === 'native' ? 'selected' : ''}>Native HA</option>
        </select>
      </div>
      
      <div class="editor-row">
        <label>Covers Theme</label>
        <select id="theme_covers">
          <option value="" ${!this._config.theme_covers ? 'selected' : ''}>Use global</option>
          <option value="dark" ${this._config.theme_covers === 'dark' ? 'selected' : ''}>Dark Glass</option>
          <option value="light" ${this._config.theme_covers === 'light' ? 'selected' : ''}>Light Glass</option>
          <option value="liquid" ${this._config.theme_covers === 'liquid' ? 'selected' : ''}>Liquid Glass</option>
          <option value="native" ${this._config.theme_covers === 'native' ? 'selected' : ''}>Native HA</option>
        </select>
      </div>
      
      <div class="section-title">Advanced</div>
      
      <div class="editor-row">
        <label>Custom CSS (card-mod style)</label>
        <textarea id="card_mod_style" rows="4" style="width: 100%; padding: 10px 12px; border: 1px solid var(--divider-color, rgba(255,255,255,0.12)); border-radius: 8px; background: var(--card-background-color, rgba(255,255,255,0.05)); color: var(--primary-text-color); font-family: monospace; font-size: 12px; resize: vertical;">${this._config.card_mod?.style || ''}</textarea>
      </div>
    `;

    this._attachListeners();
  }

  _attachListeners() {
    this.shadowRoot.querySelectorAll('.theme-option').forEach(el => {
      el.addEventListener('click', () => {
        this._updateConfig('theme', el.dataset.theme);
        this._render();
      });
    });

    ['title', 'empty_message'].forEach(id => {
      const input = this.shadowRoot.getElementById(id);
      if (input) {
        input.addEventListener('input', (e) => {
          this._updateConfig(id, e.target.value);
        });
      }
    });

    ['columns'].forEach(id => {
      const input = this.shadowRoot.getElementById(id);
      if (input) {
        input.addEventListener('change', (e) => {
          this._updateConfig(id, parseInt(e.target.value) || 2);
        });
      }
    });

    ['show_empty_message', 'show_climate_controls', 'show_cover_controls', 'light_compact', 'climate_compact', 'cover_compact', 'allow_reorder'].forEach(id => {
      const input = this.shadowRoot.getElementById(id);
      if (input) {
        input.addEventListener('change', (e) => {
          this._updateConfig(id, e.target.checked);
        });
      }
    });

    // Per-category theme selectors
    ['theme_lights', 'theme_climate', 'theme_covers'].forEach(id => {
      const select = this.shadowRoot.getElementById(id);
      if (select) {
        select.addEventListener('change', (e) => {
          this._updateConfig(id, e.target.value || null);
        });
      }
    });

    const cssInput = this.shadowRoot.getElementById('card_mod_style');
    if (cssInput) {
      cssInput.addEventListener('input', (e) => {
        const style = e.target.value.trim();
        if (style) {
          this._config.card_mod = { style };
        } else {
          delete this._config.card_mod;
        }
        this._dispatchChange();
      });
    }
  }

  _updateConfig(key, value) {
    this._config = { ...this._config, [key]: value };
    this._dispatchChange();
  }

  _dispatchChange() {
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this._config },
      bubbles: true,
      composed: true,
    }));
  }
}

if (!customElements.get('favorites-grid-card-editor')) {
  customElements.define('favorites-grid-card-editor', FavoritesGridCardEditor);
}



class FavoritesGridCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass = null;
    this._favorites = [];
    this._entityIds = new Set();
    this._lastSensorIds = '';
    this._renderedKey = '';
    this._isFirstRender = true;
    this._openDropdownId = null;
    this._openFanDropdownId = null;
    this._draggedItem = null;
    this._userId = null;

    this._longPressTimer = null;
    this._longPressGlowTimer = null;
    this._longPressStartPos = null;
    this._longPressEntity = null;
    this._isLongPressing = false;
    this._renameEntityId = null;

    // New: Recently removed tracking
    this._recentlyRemoved = [];
    this._showRecentlyRemovedPopup = false;

    // New: Entity picker for quick add
    this._showEntityPicker = false;
    this._entityPickerSearch = '';

    // New: Control popup for compact climate/cover
    this._controlPopupEntityId = null;

    // Bulk delete state
    this._isSelectionMode = false;
    this._selectedEntities = new Set();

    // Entity Picker Filter
    this._entityPickerFilter = 'all';
  }

  static getConfigElement() {
    return document.createElement('favorites-grid-card-editor');
  }

  static getStubConfig() {
    return {
      title: 'Favorites',
      theme: 'dark',
      columns: 2,
      show_empty_message: true,
      empty_message: 'No favorites yet!',
      show_climate_controls: true,
      show_cover_controls: true,
      light_compact: true,
      allow_reorder: true,
    };
  }

  _getThemeStyles() {
    const theme = this._config.theme || 'dark';

    const themes = {
      dark: `
        --fgc-card-bg: rgba(25, 25, 28, 0.55);
        --fgc-card-border: rgba(255, 255, 255, 0.06);
        --fgc-card-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05);
        --fgc-card-blur: blur(10px);
        --fgc-card-radius: 24px;
        
        --fgc-item-bg: rgba(40, 40, 45, 0.6);
        --fgc-item-border: rgba(255, 255, 255, 0.08);
        --fgc-item-hover-bg: rgba(50, 50, 55, 0.7);
        --fgc-item-hover-border: rgba(255, 255, 255, 0.12);
        
        --fgc-text-primary: rgba(255, 255, 255, 0.92);
        --fgc-text-secondary: rgba(255, 255, 255, 0.5);
        --fgc-text-tertiary: rgba(255, 255, 255, 0.35);
        
        --fgc-icon-bg: rgba(255, 255, 255, 0.1);
        --fgc-icon-color: rgba(255, 255, 255, 0.8);
        
        --fgc-control-bg: rgba(0, 0, 0, 0.3);
        --fgc-button-bg: rgba(255, 255, 255, 0.1);
        --fgc-button-hover-bg: rgba(255, 255, 255, 0.2);
        
        --fgc-dropdown-bg: rgba(25, 25, 30, 0.98);
        --fgc-dropdown-border: rgba(255, 255, 255, 0.15);
        
        --fgc-accent-primary: #00897b;
        --fgc-accent-secondary: #00acc1;
        --fgc-accent-gradient: linear-gradient(135deg, #00897b, #00acc1);
        
        --fgc-light-on-bg: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(200, 230, 255, 0.1));
        --fgc-light-on-border: rgba(255, 255, 255, 0.35);
        --fgc-light-on-shadow: 0 4px 20px rgba(255, 255, 255, 0.15), inset 0 1px 0 rgba(255,255,255,0.2);
        --fgc-light-on-icon-bg: linear-gradient(135deg, #ffffff, #e0f7fa);
        --fgc-light-on-icon-shadow: 0 2px 16px rgba(255, 255, 255, 0.5);
        
        --fgc-climate-cool-bg: linear-gradient(135deg, rgba(40, 45, 50, 0.7), rgba(79, 195, 247, 0.25));
        --fgc-climate-cool-border: rgba(79, 195, 247, 0.5);
        --fgc-climate-cool-shadow: 0 0 20px rgba(79, 195, 247, 0.3);
        --fgc-climate-heat-bg: linear-gradient(135deg, rgba(45, 40, 35, 0.7), rgba(255, 183, 77, 0.25));
        --fgc-climate-heat-border: rgba(255, 183, 77, 0.5);
        --fgc-climate-heat-shadow: 0 0 20px rgba(255, 183, 77, 0.3);
        --fgc-climate-fan-bg: linear-gradient(135deg, rgba(40, 40, 45, 0.7), rgba(189, 189, 189, 0.2));
        --fgc-climate-fan-border: rgba(189, 189, 189, 0.4);
        --fgc-climate-fan-shadow: 0 0 15px rgba(189, 189, 189, 0.2);
        --fgc-climate-auto-bg: linear-gradient(135deg, rgba(40, 40, 50, 0.7), rgba(149, 117, 205, 0.25));
        --fgc-climate-auto-border: rgba(149, 117, 205, 0.5);
        --fgc-climate-auto-shadow: 0 0 20px rgba(149, 117, 205, 0.3);
        --fgc-climate-dry-bg: linear-gradient(135deg, rgba(45, 42, 35, 0.7), rgba(255, 167, 38, 0.2));
        --fgc-climate-dry-border: rgba(255, 167, 38, 0.45);
        --fgc-climate-dry-shadow: 0 0 15px rgba(255, 167, 38, 0.25);
        
        --fgc-cover-open-bg: linear-gradient(135deg, rgba(40, 50, 40, 0.7), rgba(129, 199, 132, 0.2));
        --fgc-cover-open-border: rgba(129, 199, 132, 0.5);
        --fgc-cover-open-shadow: 0 0 20px rgba(129, 199, 132, 0.3);
      `,

      light: `
        --fgc-card-bg: rgba(255, 255, 255, 0.75);
        --fgc-card-border: rgba(0, 0, 0, 0.08);
        --fgc-card-shadow: 0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8);
        --fgc-card-blur: blur(12px);
        --fgc-card-radius: 24px;
        
        --fgc-item-bg: rgba(255, 255, 255, 0.6);
        --fgc-item-border: rgba(0, 0, 0, 0.06);
        --fgc-item-hover-bg: rgba(255, 255, 255, 0.8);
        --fgc-item-hover-border: rgba(0, 0, 0, 0.1);
        
        --fgc-text-primary: rgba(0, 0, 0, 0.87);
        --fgc-text-secondary: rgba(0, 0, 0, 0.54);
        --fgc-text-tertiary: rgba(0, 0, 0, 0.38);
        
        --fgc-icon-bg: rgba(0, 0, 0, 0.06);
        --fgc-icon-color: rgba(0, 0, 0, 0.6);
        
        --fgc-control-bg: rgba(0, 0, 0, 0.04);
        --fgc-button-bg: rgba(0, 0, 0, 0.06);
        --fgc-button-hover-bg: rgba(0, 0, 0, 0.1);
        
        --fgc-dropdown-bg: rgba(255, 255, 255, 0.98);
        --fgc-dropdown-border: rgba(0, 0, 0, 0.12);
        
        --fgc-accent-primary: #00796b;
        --fgc-accent-secondary: #0097a7;
        --fgc-accent-gradient: linear-gradient(135deg, #00796b, #0097a7);
        
        --fgc-light-on-bg: linear-gradient(135deg, rgba(0, 150, 136, 0.15), rgba(0, 188, 212, 0.1));
        --fgc-light-on-border: rgba(0, 150, 136, 0.35);
        --fgc-light-on-shadow: 0 4px 20px rgba(0, 150, 136, 0.15), inset 0 1px 0 rgba(255,255,255,0.5);
        --fgc-light-on-icon-bg: linear-gradient(135deg, #26a69a, #4dd0e1);
        --fgc-light-on-icon-shadow: 0 2px 12px rgba(0, 150, 136, 0.4);
        
        --fgc-climate-cool-bg: linear-gradient(135deg, rgba(227, 242, 253, 0.9), rgba(179, 229, 252, 0.6));
        --fgc-climate-cool-border: rgba(79, 195, 247, 0.4);
        --fgc-climate-cool-shadow: 0 0 15px rgba(79, 195, 247, 0.2);
        --fgc-climate-heat-bg: linear-gradient(135deg, rgba(255, 243, 224, 0.9), rgba(255, 224, 178, 0.6));
        --fgc-climate-heat-border: rgba(255, 183, 77, 0.4);
        --fgc-climate-heat-shadow: 0 0 15px rgba(255, 183, 77, 0.2);
        --fgc-climate-fan-bg: linear-gradient(135deg, rgba(245, 245, 245, 0.9), rgba(224, 224, 224, 0.6));
        --fgc-climate-fan-border: rgba(158, 158, 158, 0.3);
        --fgc-climate-fan-shadow: 0 0 10px rgba(158, 158, 158, 0.15);
        --fgc-climate-auto-bg: linear-gradient(135deg, rgba(237, 231, 246, 0.9), rgba(209, 196, 233, 0.6));
        --fgc-climate-auto-border: rgba(149, 117, 205, 0.35);
        --fgc-climate-auto-shadow: 0 0 15px rgba(149, 117, 205, 0.2);
        --fgc-climate-dry-bg: linear-gradient(135deg, rgba(255, 248, 225, 0.9), rgba(255, 236, 179, 0.6));
        --fgc-climate-dry-border: rgba(255, 167, 38, 0.35);
        --fgc-climate-dry-shadow: 0 0 12px rgba(255, 167, 38, 0.18);
        
        --fgc-cover-open-bg: linear-gradient(135deg, rgba(232, 245, 233, 0.9), rgba(200, 230, 201, 0.6));
        --fgc-cover-open-border: rgba(129, 199, 132, 0.4);
        --fgc-cover-open-shadow: 0 0 15px rgba(129, 199, 132, 0.2);
      `,

      liquid: `
        --fgc-card-bg: rgba(255, 255, 255, 0.12);
        --fgc-card-border: rgba(255, 255, 255, 0.25);
        --fgc-card-shadow: 0 8px 32px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1) inset;
        --fgc-card-blur: blur(20px) saturate(180%);
        --fgc-card-radius: 28px;
        
        --fgc-item-bg: rgba(255, 255, 255, 0.08);
        --fgc-item-border: rgba(255, 255, 255, 0.15);
        --fgc-item-hover-bg: rgba(255, 255, 255, 0.15);
        --fgc-item-hover-border: rgba(255, 255, 255, 0.25);
        
        --fgc-text-primary: rgba(255, 255, 255, 0.95);
        --fgc-text-secondary: rgba(255, 255, 255, 0.6);
        --fgc-text-tertiary: rgba(255, 255, 255, 0.4);
        
        --fgc-icon-bg: rgba(255, 255, 255, 0.15);
        --fgc-icon-color: rgba(255, 255, 255, 0.85);
        
        --fgc-control-bg: rgba(0, 0, 0, 0.15);
        --fgc-button-bg: rgba(255, 255, 255, 0.12);
        --fgc-button-hover-bg: rgba(255, 255, 255, 0.22);
        
        --fgc-dropdown-bg: rgba(30, 30, 35, 0.85);
        --fgc-dropdown-border: rgba(255, 255, 255, 0.2);
        
        --fgc-accent-primary: #26a69a;
        --fgc-accent-secondary: #4dd0e1;
        --fgc-accent-gradient: linear-gradient(135deg, #26a69a, #4dd0e1);
        
        --fgc-light-on-bg: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(200, 230, 255, 0.1));
        --fgc-light-on-border: rgba(255, 255, 255, 0.4);
        --fgc-light-on-shadow: 0 4px 24px rgba(255, 255, 255, 0.2), inset 0 0 0 1px rgba(255,255,255,0.2);
        --fgc-light-on-icon-bg: linear-gradient(135deg, #ffffff, #e0f7fa);
        --fgc-light-on-icon-shadow: 0 2px 20px rgba(255, 255, 255, 0.6);
        
        --fgc-climate-cool-bg: linear-gradient(135deg, rgba(79, 195, 247, 0.25), rgba(129, 212, 250, 0.15));
        --fgc-climate-cool-border: rgba(79, 195, 247, 0.5);
        --fgc-climate-cool-shadow: 0 0 20px rgba(79, 195, 247, 0.35);
        --fgc-climate-heat-bg: linear-gradient(135deg, rgba(255, 183, 77, 0.25), rgba(255, 204, 128, 0.15));
        --fgc-climate-heat-border: rgba(255, 183, 77, 0.5);
        --fgc-climate-heat-shadow: 0 0 20px rgba(255, 183, 77, 0.35);
        --fgc-climate-fan-bg: linear-gradient(135deg, rgba(189, 189, 189, 0.2), rgba(224, 224, 224, 0.1));
        --fgc-climate-fan-border: rgba(189, 189, 189, 0.45);
        --fgc-climate-fan-shadow: 0 0 15px rgba(189, 189, 189, 0.25);
        --fgc-climate-auto-bg: linear-gradient(135deg, rgba(149, 117, 205, 0.25), rgba(179, 157, 219, 0.15));
        --fgc-climate-auto-border: rgba(149, 117, 205, 0.5);
        --fgc-climate-auto-shadow: 0 0 20px rgba(149, 117, 205, 0.35);
        --fgc-climate-dry-bg: linear-gradient(135deg, rgba(255, 167, 38, 0.2), rgba(255, 183, 77, 0.1));
        --fgc-climate-dry-border: rgba(255, 167, 38, 0.45);
        --fgc-climate-dry-shadow: 0 0 15px rgba(255, 167, 38, 0.3);
        
        --fgc-cover-open-bg: linear-gradient(135deg, rgba(129, 199, 132, 0.25), rgba(165, 214, 167, 0.15));
        --fgc-cover-open-border: rgba(129, 199, 132, 0.5);
        --fgc-cover-open-shadow: 0 0 20px rgba(129, 199, 132, 0.35);
      `,

      native: `
        --fgc-card-bg: var(--ha-card-background, var(--card-background-color, #fff));
        --fgc-card-border: var(--ha-card-border-color, var(--divider-color, rgba(0,0,0,0.12)));
        --fgc-card-shadow: var(--ha-card-box-shadow, 0 2px 2px rgba(0,0,0,0.14));
        --fgc-card-blur: none;
        --fgc-card-radius: var(--ha-card-border-radius, 12px);
        
        --fgc-item-bg: var(--secondary-background-color, rgba(0,0,0,0.04));
        --fgc-item-border: var(--divider-color, rgba(0,0,0,0.08));
        --fgc-item-hover-bg: var(--secondary-background-color, rgba(0,0,0,0.08));
        --fgc-item-hover-border: var(--divider-color, rgba(0,0,0,0.12));
        
        --fgc-text-primary: var(--primary-text-color, rgba(0,0,0,0.87));
        --fgc-text-secondary: var(--secondary-text-color, rgba(0,0,0,0.54));
        --fgc-text-tertiary: var(--disabled-text-color, rgba(0,0,0,0.38));
        
        --fgc-icon-bg: var(--secondary-background-color, rgba(0,0,0,0.06));
        --fgc-icon-color: var(--secondary-text-color, rgba(0,0,0,0.6));
        
        --fgc-control-bg: var(--secondary-background-color, rgba(0,0,0,0.04));
        --fgc-button-bg: var(--secondary-background-color, rgba(0,0,0,0.06));
        --fgc-button-hover-bg: var(--primary-color, #03a9f4);
        
        --fgc-dropdown-bg: var(--card-background-color, #fff);
        --fgc-dropdown-border: var(--divider-color, rgba(0,0,0,0.12));
        
        --fgc-accent-primary: var(--primary-color, #03a9f4);
        --fgc-accent-secondary: var(--accent-color, #ff9800);
        --fgc-accent-gradient: linear-gradient(135deg, var(--primary-color, #03a9f4), var(--accent-color, #ff9800));
        
        --fgc-light-on-bg: var(--primary-color, rgba(3, 169, 244, 0.15));
        --fgc-light-on-border: var(--primary-color, rgba(3, 169, 244, 0.35));
        --fgc-light-on-shadow: none;
        --fgc-light-on-icon-bg: var(--primary-color, #03a9f4);
        --fgc-light-on-icon-shadow: none;
        
        --fgc-climate-cool-bg: var(--state-climate-cool-color, rgba(33, 150, 243, 0.1));
        --fgc-climate-cool-border: var(--state-climate-cool-color, rgba(33, 150, 243, 0.3));
        --fgc-climate-cool-shadow: none;
        --fgc-climate-heat-bg: var(--state-climate-heat-color, rgba(255, 152, 0, 0.1));
        --fgc-climate-heat-border: var(--state-climate-heat-color, rgba(255, 152, 0, 0.3));
        --fgc-climate-heat-shadow: none;
        --fgc-climate-fan-bg: rgba(158, 158, 158, 0.1);
        --fgc-climate-fan-border: rgba(158, 158, 158, 0.25);
        --fgc-climate-fan-shadow: none;
        --fgc-climate-auto-bg: rgba(149, 117, 205, 0.1);
        --fgc-climate-auto-border: rgba(149, 117, 205, 0.25);
        --fgc-climate-auto-shadow: none;
        --fgc-climate-dry-bg: rgba(255, 167, 38, 0.1);
        --fgc-climate-dry-border: rgba(255, 167, 38, 0.25);
        --fgc-climate-dry-shadow: none;
        
        --fgc-cover-open-bg: rgba(76, 175, 80, 0.1);
        --fgc-cover-open-border: rgba(76, 175, 80, 0.3);
        --fgc-cover-open-shadow: none;
      `,
    };

    return themes[theme] || themes.dark;
  }

  connectedCallback() {
    this._lastSensorIds = '';

    if (this._hass) {
      this._syncFromSensor();
    }

    this._handleUpdate = (e) => {
      const { entity_id, isFavorite, user_id } = e.detail;

      if (user_id && this._userId && user_id !== this._userId) {
        return;
      }

      if (isFavorite) {
        if (!this._entityIds.has(entity_id)) {
          this._entityIds.add(entity_id);
          this._favorites.push({
            entity_id: entity_id,
            added_at: new Date().toISOString(),
            custom_name: null,
            custom_icon: null,
          });
          this._smartRender();
        }
      } else {
        if (this._entityIds.has(entity_id)) {
          this._entityIds.delete(entity_id);
          this._favorites = this._favorites.filter(f => f.entity_id !== entity_id);
          this._smartRender();
        }
      }
    };

    window.addEventListener('favorites-updated', this._handleUpdate);

    this._handleDocClick = (e) => {
      if (this._openDropdownId && !e.target.closest('.climate-icon-btn')) {
        this._closeDropdown();
      }
      if (this._openFanDropdownId && !e.target.closest('.fan-mode-btn')) {
        this._closeFanDropdown();
      }
    };
    document.addEventListener('click', this._handleDocClick);
  }

  disconnectedCallback() {
    if (this._handleUpdate) {
      window.removeEventListener('favorites-updated', this._handleUpdate);
    }
    if (this._handleDocClick) {
      document.removeEventListener('click', this._handleDocClick);
    }
  }

  setConfig(config) {
    this._config = {
      title: 'Favorites',
      theme: 'dark',
      columns: 2,
      show_empty_message: true,
      empty_message: 'No favorites yet!',
      compact: false,
      show_climate_controls: true,
      show_cover_controls: true,
      light_compact: true,
      allow_reorder: true,
      ...config,
    };
    this._smartRender();
  }

  set hass(hass) {
    this._hass = hass;
    this._userId = hass.user?.id || null;

    const sensor = hass.states['sensor.favorites_list'];
    const users = sensor?.attributes?.users || {};
    const userItems = this._userId ? (users[this._userId] || []) : [];
    const sensorIds = JSON.stringify(userItems.map(item => item.entity_id));

    if (sensorIds !== this._lastSensorIds) {
      this._lastSensorIds = sensorIds;
      this._syncFromSensor();
    } else {
      this._updateStates();
    }
  }

  _syncFromSensor() {
    if (!this._hass) return;

    const sensor = this._hass.states['sensor.favorites_list'];
    const users = sensor?.attributes?.users || {};
    const userItems = this._userId ? (users[this._userId] || []) : [];
    this._favorites = userItems;
    this._entityIds = new Set(userItems.map(item => item.entity_id));

    // Sync recently removed from sensor
    const recentlyRemovedSensor = this._hass.states['sensor.favorites_recently_removed'];
    const recentlyRemovedUsers = recentlyRemovedSensor?.attributes?.users || {};
    this._recentlyRemoved = this._userId ? (recentlyRemovedUsers[this._userId] || []) : [];

    this._smartRender();
  }

  _smartRender() {
    // Include popup states in render key to ensure they trigger re-renders
    const popupState = `${this._showEntityPicker}_${this._showRecentlyRemovedPopup}_${this._controlPopupEntityId || ''}`;
    const newKey = this._favorites.map(f => f.entity_id).join(',') + '_' + (this._config.theme || 'dark') + '_' + popupState;

    if (newKey === this._renderedKey && !this._isFirstRender) {
      this._updateStates();
      return;
    }

    this._renderedKey = newKey;
    this._isFirstRender = false;
    this._render();
  }

  _updateStates() {
    this._favorites.forEach(fav => {
      const entity = this._hass?.states[fav.entity_id];
      const item = this.shadowRoot?.querySelector(`[data-entity="${fav.entity_id}"]`);
      if (!item || !entity) return;

      const domain = fav.entity_id.split('.')[0];

      if (domain === 'climate') {
        const isOn = entity.state !== 'off' && entity.state !== 'unavailable';
        const mode = entity.state;
        const fanMode = entity.attributes?.fan_mode;
        const fanModes = entity.attributes?.fan_modes || [];

        item.classList.toggle('is-on', isOn);
        item.classList.toggle('is-cooling', mode === 'cool');
        item.classList.toggle('is-heating', mode === 'heat');
        item.classList.toggle('is-fan-only', mode === 'fan_only');
        item.classList.toggle('is-auto', mode === 'auto' || mode === 'heat_cool');
        item.classList.toggle('is-dry', mode === 'dry');
        item.classList.toggle('is-off', !isOn);

        const modeEl = item.querySelector('.climate-center-state');
        if (modeEl) {
          let stateLabel = mode;
          if (isOn) {
            if (fanModes.length > 0 && fanMode) {
              stateLabel = `${mode} · ${fanMode}`;
            }
          } else {
            stateLabel = 'Off';
          }
          modeEl.textContent = stateLabel;
        }

        const iconEl = item.querySelector('.climate-icon-btn ha-icon');
        if (iconEl) iconEl.setAttribute('icon', this._getClimateIcon(mode));

        const tempEl = item.querySelector('.climate-temp');
        if (tempEl) {
          const temp = entity.attributes?.temperature;
          tempEl.textContent = isOn && temp ? `${temp}°` : '--';
        }

        const controls = item.querySelector('.climate-controls');
        if (controls) {
          controls.classList.toggle('disabled', !isOn);
        }

        const fanWrap = item.querySelector('.fan-mode-wrap');
        if (fanWrap) {
          fanWrap.classList.toggle('disabled', !isOn);
        }

        const fanIconEl = item.querySelector('.fan-mode-btn ha-icon');
        if (fanIconEl && fanMode) {
          fanIconEl.setAttribute('icon', this._getFanIcon(fanMode));
        }
      } else if (domain === 'light') {
        const isOn = entity.state === 'on';
        item.classList.toggle('is-on', isOn);

        const stateEl = item.querySelector('.state');
        if (stateEl) stateEl.textContent = isOn ? 'On' : 'Off';
      } else if (domain === 'cover') {
        const state = entity.state;
        const position = entity.attributes?.current_position;

        const isClosed = state === 'closed';
        const isMoving = state === 'opening' || state === 'closing';
        const isOpen = !isClosed && !isMoving && state !== 'unavailable';

        item.classList.toggle('is-open', isOpen);
        item.classList.toggle('is-closed', isClosed);
        item.classList.toggle('is-moving', isMoving);

        const statusTextEl = item.querySelector('.cover-status-text');
        if (statusTextEl) statusTextEl.textContent = state;

        const centerStateEl = item.querySelector('.cover-center-state');
        if (centerStateEl) {
          let stateLabel = state;
          if (isClosed) {
            stateLabel = 'Closed';
          } else if (isMoving) {
            stateLabel = state === 'opening' ? 'Opening' : 'Closing';
          } else if (isOpen) {
            if (position !== undefined && position !== null && typeof position === 'number') {
              stateLabel = position === 100 ? 'Open' : position === 0 ? 'Closed' : `${Math.round(position)}%`;
            } else {
              stateLabel = 'Open';
            }
          } else {
            stateLabel = state.charAt(0).toUpperCase() + state.slice(1);
          }
          centerStateEl.textContent = stateLabel;
        }

        const iconEl = item.querySelector('.cover-icon-wrap ha-icon');
        if (iconEl) iconEl.setAttribute('icon', this._getCoverIcon(state, position));

        const isFullyOpen = position === 100 || (position === undefined && state === 'open');
        const closeBtn = item.querySelector('.cover-control-btn.close');
        const openBtn = item.querySelector('.cover-control-btn.open');

        if (closeBtn) closeBtn.classList.toggle('disabled', isClosed);
        if (openBtn) openBtn.classList.toggle('disabled', isFullyOpen);
      } else {
        const isOn = ['on', 'home', 'playing', 'open', 'unlocked'].includes(entity.state);
        item.classList.toggle('is-on', isOn);

        const stateEl = item.querySelector('.state');
        if (stateEl) stateEl.textContent = entity.state || 'unavailable';
      }
    });

    const countEl = this.shadowRoot?.querySelector('.count');
    if (countEl) countEl.textContent = `${this._favorites.length} items`;

    // Update control popup content if open
    if (this._controlPopupEntityId) {
      this._updateControlPopupContent();
    }
  }

  _updateControlPopupContent() {
    if (!this._controlPopupEntityId || !this._hass) return;

    const entity = this._hass.states[this._controlPopupEntityId];
    if (!entity) return;

    const domain = this._controlPopupEntityId.split('.')[0];

    if (domain === 'climate') {
      const temp = entity.attributes?.temperature || 22;
      const mode = entity.state || 'off';
      const fanMode = entity.attributes?.fan_mode;
      const isOn = mode !== 'off' && mode !== 'unavailable';

      // Update temperature display
      const tempDisplay = this.shadowRoot?.querySelector('.control-temp-display');
      if (tempDisplay) {
        tempDisplay.innerHTML = `${isOn ? temp : '--'}<span>°</span>`;
      }

      // Update mode buttons
      this.shadowRoot?.querySelectorAll('.control-popup .control-mode-btn[data-mode]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
      });

      // Update fan mode buttons
      this.shadowRoot?.querySelectorAll('.control-popup .control-mode-btn[data-fan-mode]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.fanMode === fanMode);
      });
    } else if (domain === 'cover') {
      const position = entity.attributes?.current_position ?? 100;
      const state = entity.state;

      // Update position display
      const posDisplay = this.shadowRoot?.querySelector('.control-cover-position');
      if (posDisplay) {
        posDisplay.innerHTML = `${position}<span>%</span>`;
      }

      // Update slider
      const slider = this.shadowRoot?.querySelector('.control-cover-slider');
      if (slider) {
        slider.value = position;
      }

      // Update action buttons
      this.shadowRoot?.querySelectorAll('.control-cover-btn').forEach(btn => {
        const action = btn.dataset.action;
        btn.classList.toggle('active',
          (action === 'open' && state === 'open') ||
          (action === 'close' && state === 'closed')
        );
      });
    }
  }

  // ============================================
  // CLIMATE METHODS
  // ============================================
  _getClimateIcon(state) {
    const icons = {
      'cool': 'mdi:snowflake',
      'heat': 'mdi:fire',
      'heat_cool': 'mdi:autorenew',
      'auto': 'mdi:autorenew',
      'dry': 'mdi:water-percent',
      'fan_only': 'mdi:fan',
      'off': 'mdi:power',
    };
    return icons[state] || 'mdi:air-conditioner';
  }

  _getModeLabel(mode) {
    const labels = {
      'cool': 'Cool',
      'heat': 'Heat',
      'heat_cool': 'Auto',
      'auto': 'Auto',
      'dry': 'Dry',
      'fan_only': 'Fan',
      'off': 'Off',
    };
    return labels[mode] || mode;
  }

  _getFanIcon(fanMode) {
    const icons = {
      'auto': 'mdi:fan-auto',
      'low': 'mdi:fan-speed-1',
      'medium': 'mdi:fan-speed-2',
      'high': 'mdi:fan-speed-3',
      'turbo': 'mdi:fan-plus',
      'quiet': 'mdi:fan-minus',
      'on': 'mdi:fan',
      'off': 'mdi:fan-off',
    };
    return icons[fanMode?.toLowerCase()] || 'mdi:fan';
  }

  _getFanModeLabel(fanMode) {
    if (!fanMode) return 'Auto';
    return fanMode.charAt(0).toUpperCase() + fanMode.slice(1).toLowerCase();
  }

  _toggleFanDropdown(entityId, e) {
    e.stopPropagation();

    const item = this.shadowRoot.querySelector(`[data-entity="${entityId}"]`);
    const dropdown = item?.querySelector('.fan-dropdown');

    if (this._openFanDropdownId === entityId) {
      dropdown?.classList.remove('show');
      this._openFanDropdownId = null;
    } else {
      this._closeDropdown();
      this._closeFanDropdown();

      this._openFanDropdownId = entityId;
      dropdown?.classList.add('show');
    }
  }

  _closeFanDropdown() {
    if (this._openFanDropdownId) {
      const item = this.shadowRoot.querySelector(`[data-entity="${this._openFanDropdownId}"]`);
      const dropdown = item?.querySelector('.fan-dropdown');
      dropdown?.classList.remove('show');
      this._openFanDropdownId = null;
    }
  }

  async _setFanMode(entityId, fanMode, e) {
    e.stopPropagation();
    this._closeFanDropdown();

    await this._hass.callService('climate', 'set_fan_mode', {
      entity_id: entityId,
      fan_mode: fanMode,
    });
  }

  _toggleClimateDropdown(entityId, e) {
    e.stopPropagation();

    if (this._openDropdownId === entityId) {
      this._closeDropdown();
    } else {
      this._closeDropdown();
      this._closeFanDropdown();
      this._openDropdownId = entityId;

      const item = this.shadowRoot.querySelector(`[data-entity="${entityId}"]`);
      const dropdown = item?.querySelector('.hvac-dropdown');
      if (dropdown) {
        dropdown.classList.add('show');
      }
    }
  }

  _closeDropdown() {
    if (this._openDropdownId) {
      const item = this.shadowRoot.querySelector(`[data-entity="${this._openDropdownId}"]`);
      const dropdown = item?.querySelector('.hvac-dropdown');
      if (dropdown) {
        dropdown.classList.remove('show');
      }
      this._openDropdownId = null;
    }
  }

  async _setHvacMode(entityId, mode, e) {
    e.stopPropagation();
    this._closeDropdown();

    await this._hass.callService('climate', 'set_hvac_mode', {
      entity_id: entityId,
      hvac_mode: mode,
    });
  }

  async _climateSetTemp(entityId, delta, e) {
    e.stopPropagation();

    const entity = this._hass?.states[entityId];
    if (!entity || entity.state === 'off') return;

    const currentTemp = entity.attributes?.temperature || 22;
    const minTemp = entity.attributes?.min_temp || 16;
    const maxTemp = entity.attributes?.max_temp || 30;
    const step = entity.attributes?.target_temp_step || 1;

    let newTemp = currentTemp + (delta * step);
    newTemp = Math.max(minTemp, Math.min(maxTemp, newTemp));

    const tempEl = this.shadowRoot.querySelector(`[data-entity="${entityId}"] .climate-temp`);
    if (tempEl) tempEl.textContent = `${newTemp}°`;

    await this._hass.callService('climate', 'set_temperature', {
      entity_id: entityId,
      temperature: newTemp,
    });
  }

  // ============================================
  // LIGHT METHODS
  // ============================================
  _toggleLight(entityId, e) {
    e.stopPropagation();
    this._hass.callService('light', 'toggle', { entity_id: entityId });
  }

  // ============================================
  // COVER METHODS
  // ============================================
  _coverControl(entityId, action, e) {
    e.stopPropagation();
    const serviceMap = {
      'open': 'open_cover',
      'close': 'close_cover',
      'stop': 'stop_cover'
    };
    const service = serviceMap[action];
    if (service) {
      this._hass.callService('cover', service, { entity_id: entityId });
    }
  }

  _getCoverIcon(state, position) {
    if (state === 'opening') return 'mdi:arrow-up-box';
    if (state === 'closing') return 'mdi:arrow-down-box';
    if (state === 'closed' || position === 0) return 'mdi:blinds';
    if (position !== undefined && position < 100) return 'mdi:blinds-open';
    return 'mdi:blinds-open';
  }

  // ============================================
  // DRAG AND DROP
  // ============================================
  _handleDragStart(e, entityId) {
    this._draggedItem = entityId;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', entityId);
  }

  _handleDragEnd(e) {
    e.target.classList.remove('dragging');
    this._draggedItem = null;

    this.shadowRoot.querySelectorAll('.drag-over').forEach(el => {
      el.classList.remove('drag-over');
    });
  }

  _handleDragOver(e, entityId) {
    e.preventDefault();
    if (this._draggedItem === entityId) return;

    const item = this.shadowRoot.querySelector(`[data-entity="${entityId}"]`);
    if (item && !item.classList.contains('dragging')) {
      this.shadowRoot.querySelectorAll('.drag-over').forEach(el => {
        el.classList.remove('drag-over');
      });
      item.classList.add('drag-over');
    }
  }

  _handleDrop(e, targetEntityId) {
    e.preventDefault();

    if (!this._draggedItem || this._draggedItem === targetEntityId) return;

    const draggedIndex = this._favorites.findIndex(f => f.entity_id === this._draggedItem);
    const targetIndex = this._favorites.findIndex(f => f.entity_id === targetEntityId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const [draggedFav] = this._favorites.splice(draggedIndex, 1);
    this._favorites.splice(targetIndex, 0, draggedFav);

    this._renderedKey = '';
    this._smartRender();

    const newOrder = this._favorites.map(f => f.entity_id);
    this._hass.callService('favorites', 'reorder', {
      entity_ids: newOrder,
      user_id: this._userId
    });
  }

  // ============================================
  // COMMON METHODS
  // ============================================

  _toggleSelectionMode(enable) {
    this._isSelectionMode = enable;
    this._selectedEntities.clear();

    // Toggle class on the main card container for CSS-based visibility
    const card = this.shadowRoot.querySelector('.card');
    if (card) {
      if (enable) card.classList.add('selection-mode');
      else card.classList.remove('selection-mode');
    }

    // Clear any selected items visually
    this.shadowRoot.querySelectorAll('.item.selected').forEach(el => {
      el.classList.remove('selected');
    });

    this._updateHeaderButtons();
  }

  _toggleItemSelection(entityId, element) {
    if (this._selectedEntities.has(entityId)) {
      this._selectedEntities.delete(entityId);
      element.classList.remove('selected');
    } else {
      this._selectedEntities.add(entityId);
      element.classList.add('selected');
    }
    this._updateHeaderButtons();
  }

  _updateHeaderButtons() {
    // Direct DOM manipulation for zero-lag updates
    const deleteBtn = this.shadowRoot.querySelector('.selection-delete-btn');
    if (!deleteBtn) return;

    if (this._selectedEntities.size > 0) {
      deleteBtn.classList.add('active');
      let countSpan = deleteBtn.querySelector('.delete-count');
      if (!countSpan) {
        countSpan = document.createElement('span');
        countSpan.className = 'delete-count';
        deleteBtn.appendChild(countSpan);
      }
      countSpan.textContent = this._selectedEntities.size;
    } else {
      deleteBtn.classList.remove('active');
      const countSpan = deleteBtn.querySelector('.delete-count');
      if (countSpan) countSpan.remove();
    }
  }

  async _performBulkDelete() {
    if (this._selectedEntities.size === 0) return;

    // Visual removal
    for (const entityId of this._selectedEntities) {
      const item = this.shadowRoot.querySelector(`[data-entity="${entityId}"]`);
      if (item) item.classList.add('removing');
    }

    await new Promise(r => setTimeout(r, 200));

    // Actual removal
    const entitiesToRemove = Array.from(this._selectedEntities);

    for (const entityId of entitiesToRemove) {
      this._entityIds.delete(entityId);
      this._favorites = this._favorites.filter(f => f.entity_id !== entityId);
    }

    this._lastSensorIds = JSON.stringify(Array.from(this._entityIds));
    this._toggleSelectionMode(false); // Exit mode
    this._smartRender(); // Full render to update grid

    // Backend calls
    for (const entityId of entitiesToRemove) {
      await this._hass.callService('favorites', 'remove', {
        entity_id: entityId,
        user_id: this._userId
      });
    }
  }

  async _removeFavorite(entityId, e) {
    e.stopPropagation();

    const item = this.shadowRoot.querySelector(`[data-entity="${entityId}"]`);
    if (item) {
      item.classList.add('removing');
      await new Promise(r => setTimeout(r, 200));
    }

    this._entityIds.delete(entityId);
    this._favorites = this._favorites.filter(f => f.entity_id !== entityId);
    this._lastSensorIds = JSON.stringify(Array.from(this._entityIds));
    this._smartRender();

    await this._hass.callService('favorites', 'remove', {
      entity_id: entityId,
      user_id: this._userId
    });
  }

  _toggleEntity(entityId) {
    const domain = entityId.split('.')[0];
    if (['switch', 'fan', 'input_boolean'].includes(domain)) {
      this._hass.callService(domain, 'toggle', { entity_id: entityId });
    }
  }

  async _autoSort() {
    // Sort entities by domain priority to optimize grid layout
    // Priority: lights first (compact, span 2), then climate/covers (span 4), then standard items (span 2)
    const domainPriority = {
      'light': 1,
      'switch': 2,
      'fan': 3,
      'input_boolean': 4,
      'lock': 5,
      'sensor': 6,
      'binary_sensor': 7,
      'media_player': 8,
      'climate': 10,  // Larger items last for better grid filling
      'cover': 11,
    };

    const getDomainPriority = (fav) => {
      const domain = fav.entity_id.split('.')[0];
      return domainPriority[domain] ?? 9;
    };

    // Sort favorites by domain priority
    const sortedFavorites = [...this._favorites].sort((a, b) => {
      return getDomainPriority(a) - getDomainPriority(b);
    });

    // Update local state
    this._favorites = sortedFavorites;
    this._lastSensorIds = JSON.stringify(sortedFavorites.map(f => f.entity_id));
    this._smartRender();

    // Persist the new order to the backend
    await this._hass.callService('favorites', 'reorder', {
      user_id: this._userId,
      entity_ids: sortedFavorites.map(f => f.entity_id),
    });
  }

  _getIcon(fav) {
    const entity = this._hass?.states[fav.entity_id];
    if (fav.custom_icon) return fav.custom_icon;
    if (entity?.attributes?.icon) return entity.attributes.icon;

    const domain = fav.entity_id.split('.')[0];
    const icons = {
      light: 'mdi:lightbulb',
      switch: 'mdi:toggle-switch',
      climate: 'mdi:thermostat',
      cover: 'mdi:window-shutter',
      fan: 'mdi:fan',
      lock: 'mdi:lock',
      media_player: 'mdi:play-circle',
      sensor: 'mdi:eye',
      binary_sensor: 'mdi:checkbox-marked-circle',
    };
    return icons[domain] || 'mdi:help-circle';
  }

  _getName(fav) {
    if (fav.custom_name) return fav.custom_name;
    const entity = this._hass?.states[fav.entity_id];
    return entity?.attributes?.friendly_name || fav.entity_id.split('.')[1].replace(/_/g, ' ');
  }

  _render() {
    const cols = this._config.columns || 2;
    const allowReorder = this._config.allow_reorder !== false;
    const customStyle = this._config.card_mod?.style || '';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          ${this._getThemeStyles()}
          display: block;
          box-sizing: border-box;
        }
        
        *, *:before, *:after { box-sizing: inherit; }
        
        .card {
          background: var(--fgc-card-bg);
          border: 1px solid var(--fgc-card-border);
          border-radius: var(--fgc-card-radius);
          padding: 16px;
          backdrop-filter: var(--fgc-card-blur);
          -webkit-backdrop-filter: var(--fgc-card-blur);
          box-shadow: var(--fgc-card-shadow);
        }
        
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          padding: 0 4px;
          gap: 12px;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .header-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .quick-add-btn {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          border: none;
          background: var(--fgc-accent-gradient);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .quick-add-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(0, 172, 193, 0.4);
        }
        .quick-add-btn:active {
          transform: scale(0.95);
        }
        .quick-add-btn ha-icon {
          color: white;
          --mdc-icon-size: 16px;
        }
        .recently-removed-btn {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          border: none;
          background: var(--fgc-button-bg);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          position: relative;
        }
        .recently-removed-btn:hover {
          background: var(--fgc-button-hover-bg);
          transform: scale(1.05);
        }
        .recently-removed-btn ha-icon {
          color: var(--fgc-icon-color);
          --mdc-icon-size: 16px;
        }
        .recently-removed-btn .badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #f44336;
          color: white;
          font-size: 9px;
          font-weight: 600;
          min-width: 14px;
          height: 14px;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 3px;
        }
        .auto-sort-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: var(--fgc-button-bg);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .auto-sort-btn:hover {
          background: var(--fgc-button-hover-bg);
          transform: scale(1.05);
        }
        .auto-sort-btn ha-icon {
          color: var(--fgc-icon-color);
          --mdc-icon-size: 18px;
        }
        
        /* New Bulk Delete Styles */
        .bulk-delete-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: var(--fgc-button-bg);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .bulk-delete-btn:hover {
          background: rgba(244, 67, 54, 0.2);
          transform: scale(1.05);
        }
        .bulk-delete-btn ha-icon {
          color: var(--fgc-text-secondary);
          --mdc-icon-size: 18px;
        }
        .bulk-delete-btn:hover ha-icon {
          color: #f44336;
        }
        
        /* Selection Controls */
        .selection-cancel-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: var(--fgc-button-bg);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .selection-cancel-btn:hover {
          background: var(--fgc-button-hover-bg);
          transform: scale(1.05);
        }
        .selection-cancel-btn ha-icon {
          color: var(--fgc-icon-color);
          --mdc-icon-size: 18px;
        }
        
        .selection-delete-btn {
          height: 32px;
          padding: 0 12px;
          border-radius: 8px;
          border: none;
          background: var(--fgc-button-bg);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.15s;
          opacity: 0.5;
        }
        .selection-delete-btn.active {
          background: rgba(244, 67, 54, 0.2);
          opacity: 1;
        }
        .selection-delete-btn:hover {
          background: rgba(244, 67, 54, 0.3);
          transform: scale(1.02);
        }
        .selection-delete-btn ha-icon {
          color: #f44336;
          --mdc-icon-size: 18px;
        }
        .selection-delete-btn .delete-count {
          color: #f44336;
          font-size: 13px;
          font-weight: 600;
        }
        
        /* Selection Circle - Key Performance Optimization */
        /* Always exists in DOM, hidden by default via CSS */
        .selection-circle {
          position: absolute;
          top: 8px;
          left: 8px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.5);
          background: rgba(0, 0, 0, 0.3);
          display: none; /* Hidden by default */
          align-items: center;
          justify-content: center;
          z-index: 10;
          transition: all 0.15s ease;
          pointer-events: none; /* Let clicks pass through to item handler */
        }
        
        /* Show when card has selection-mode class */
        .card.selection-mode .selection-circle {
          display: flex;
        }
        
        /* Item Selected State */
        .item.selected .selection-circle {
          background: var(--fgc-accent-gradient);
          border-color: transparent;
          box-shadow: 0 2px 8px rgba(0, 137, 123, 0.4);
        }
        .item.selected {
          box-shadow: 0 0 0 2px var(--fgc-accent-primary), 0 4px 12px rgba(0, 137, 123, 0.3);
        }
        .selection-circle ha-icon {
          color: transparent; /* Checkmark hidden when not selected */
          --mdc-icon-size: 14px;
          transition: color 0.15s;
        }
        .item.selected .selection-circle ha-icon {
          color: white; /* Checkmark shows when selected */
        }
        
        /* Disable interaction with inner elements in selection mode */
        .card.selection-mode .item > *:not(.selection-circle) {
          pointer-events: none;
        }

        /* Header Button Toggling */
        .selection-header-buttons { display: none; align-items: center; gap: 8px; }
        .normal-header-buttons { display: flex; align-items: center; gap: 8px; }
        
        .card.selection-mode .selection-header-buttons { display: flex; }
        .card.selection-mode .normal-header-buttons { display: none; }

        .title { 
          font-size: 14px; 
          font-weight: 600; 
          color: var(--fgc-text-primary);
          flex: 1;
        }
        .count { 
          font-size: 12px; 
          color: var(--fgc-text-secondary); 
          background: var(--fgc-icon-bg); 
          padding: 4px 10px; 
          border-radius: 12px; 
        }
        
        .grid {
          display: grid;
          grid-template-columns: repeat(${cols}, minmax(0, 1fr));
          grid-auto-rows: minmax(28px, auto);
          grid-auto-flow: dense;
          gap: 10px;
          align-items: start;
        }
        
        @keyframes itemRemove { to { opacity: 0; transform: scale(0.8); } }
        @keyframes itemAdd { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
        
        .item {
          position: relative;
          background: var(--fgc-item-bg);
          border: 1px solid var(--fgc-item-border);
          border-radius: 16px;
          transition: transform 0.2s, background 0.2s, border-color 0.2s, box-shadow 0.2s;
          animation: itemAdd 0.3s ease-out;
          ${allowReorder ? 'cursor: grab;' : ''}
        }
        .item:hover { 
          background: var(--fgc-item-hover-bg); 
          border-color: var(--fgc-item-hover-border); 
        }
        .item.removing { animation: itemRemove 0.2s ease-out forwards; }
        
        .item.dragging {
          opacity: 0.5;
          cursor: grabbing;
          transform: scale(1.02);
        }
        .item.drag-over {
          border-color: var(--fgc-accent-primary);
          box-shadow: 0 0 0 2px rgba(0, 137, 123, 0.3);
        }
        
        .light-item {
          grid-row: span 2;
          padding: 12px 14px;
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 12px;
          cursor: ${allowReorder ? 'grab' : 'pointer'};
          height: fit-content;
          align-self: start;
        }
        .light-item:active { transform: scale(0.98); }
        
        .light-item .icon-wrap {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--fgc-icon-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .light-item .icon-wrap ha-icon { 
          color: var(--fgc-icon-color); 
          --mdc-icon-size: 18px; 
        }
        
        .light-item.is-on {
          background: var(--fgc-light-on-bg);
          border-color: var(--fgc-light-on-border);
          box-shadow: var(--fgc-light-on-shadow);
        }
        .light-item.is-on .icon-wrap {
          background: var(--fgc-light-on-icon-bg);
          box-shadow: var(--fgc-light-on-icon-shadow);
        }
        .light-item.is-on .icon-wrap ha-icon { color: #222; }
        .light-item.is-on .state { color: var(--fgc-accent-secondary); }
        
        .light-item .item-info { display: flex; flex-direction: column; gap: 1px; flex: 1; min-width: 0; }
        .light-item .name { font-size: 13px; font-weight: 500; color: var(--fgc-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .light-item .state { font-size: 11px; color: var(--fgc-text-secondary); }
        
        .cover-item {
          grid-row: span 4;
          padding: 12px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 2px;
          cursor: ${allowReorder ? 'grab' : 'default'};
          height: 100%;
          align-self: start;
        }

        .cover-item.is-open {
          background: var(--fgc-cover-open-bg);
          border-color: var(--fgc-cover-open-border);
          box-shadow: var(--fgc-cover-open-shadow);
        }

        .cover-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          width: 100%;
        }

        .cover-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
          min-width: 0;
        }

        .cover-name-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .cover-icon-wrap {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: var(--fgc-icon-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }
        
        .cover-item.is-open .cover-icon-wrap,
        .cover-item.is-moving .cover-icon-wrap {
          background: linear-gradient(135deg, #66bb6a, #81c784);
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
        }
        
        .cover-icon-wrap ha-icon {
          color: var(--fgc-icon-color);
          --mdc-icon-size: 24px;
        }
        
        .cover-item.is-open .cover-icon-wrap ha-icon,
        .cover-item.is-moving .cover-icon-wrap ha-icon {
          color: white;
        }

        .cover-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--fgc-text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .cover-status-row {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-left: 52px;
        }
        
        .cover-status-icon {
          --mdc-icon-size: 14px;
          color: var(--fgc-text-secondary);
        }
        
        .cover-item.is-open .cover-status-icon,
        .cover-item.is-moving .cover-status-icon {
          color: #00acc1;
        }
        
        .cover-status-text {
          font-size: 12px;
          color: var(--fgc-text-secondary);
          text-transform: capitalize;
        }
        
        .cover-item.is-open .cover-status-text,
        .cover-item.is-moving .cover-status-text {
          color: #00acc1;
        }

        .cover-center-section {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 4px 0;
          flex-grow: 1;
        }
        
        .cover-center-state {
          font-size: 24px;
          font-weight: 700;
          color: var(--fgc-text-primary);
          letter-spacing: -0.5px;
          transition: all 0.15s ease;
          line-height: 1;
          text-transform: capitalize;
        }

        .cover-controls-container {
          margin-top: auto;
          width: 100%;
        }
        
        .cover-controls-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          width: 100%;
        }
        
        .cover-control-btn {
          flex: 1;
          height: 40px;
          border-radius: 12px;
          border: 1px solid var(--fgc-item-border);
          background: var(--fgc-button-bg);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        
        .cover-control-btn:hover {
          background: var(--fgc-button-hover-bg);
          transform: scale(1.02);
        }
        
        .cover-control-btn:active {
          transform: scale(0.96);
        }
        
        .cover-control-btn ha-icon {
          color: var(--fgc-icon-color);
          --mdc-icon-size: 20px;
        }

        .cover-control-btn.pause {
          flex: 0 0 50px;
          border-color: rgba(0, 172, 193, 0.3);
          background: rgba(0, 172, 193, 0.1);
        }
        
        .cover-control-btn.pause ha-icon {
           color: #00acc1;
        }
        
        .cover-control-btn.pause:hover {
           background: rgba(0, 172, 193, 0.2);
        }
        
        .cover-control-btn.disabled {
          opacity: 0.35;
          pointer-events: none;
          filter: grayscale(1);
        }
        
        .standard-item {
          grid-row: span 2;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          cursor: ${allowReorder ? 'grab' : 'pointer'};
          height: fit-content;
          align-self: start;
        }
        .standard-item:active { transform: scale(0.98); }
        .standard-item.is-on {
          background: var(--fgc-accent-gradient);
          border-color: var(--fgc-accent-secondary);
        }
        
        .item-top { display: flex; align-items: center; gap: 10px; }
        .standard-item .icon-wrap {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--fgc-icon-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .standard-item.is-on .icon-wrap {
          background: var(--fgc-accent-gradient);
          box-shadow: 0 2px 8px rgba(0,172,193,0.4);
        }
        .standard-item .icon-wrap ha-icon { color: var(--fgc-icon-color); --mdc-icon-size: 20px; }
        .standard-item.is-on .icon-wrap ha-icon { color: white; }
        
        .item-info { flex: 1; min-width: 0; }
        .name { font-size: 13px; font-weight: 500; color: var(--fgc-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .state { font-size: 11px; color: var(--fgc-text-secondary); text-transform: capitalize; }
        .standard-item.is-on .state { color: rgba(0,230,200,0.9); }
        
        .climate-item {
          grid-row: span 4;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          cursor: ${allowReorder ? 'grab' : 'default'};
          height: 100%;
          align-self: start;
        }
        
        .climate-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }
        
        .climate-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }
        
        .climate-icon-wrap {
          position: relative;
          z-index: 100;
        }
        
        .climate-icon-btn {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          border: none;
          background: var(--fgc-icon-bg);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .climate-icon-btn:hover {
          background: var(--fgc-button-hover-bg);
          transform: scale(1.05);
        }
        .climate-icon-btn ha-icon {
          color: var(--fgc-icon-color);
          --mdc-icon-size: 20px;
        }
        
        .climate-item.is-on .climate-icon-btn {
          background: linear-gradient(135deg, #00bfa5, #00e5cc);
          box-shadow: 0 4px 16px rgba(0, 230, 200, 0.5);
        }
        .climate-item.is-on .climate-icon-btn ha-icon { color: white; }
        
        .climate-item.is-cooling {
          background: var(--fgc-climate-cool-bg);
          border-color: var(--fgc-climate-cool-border);
          box-shadow: var(--fgc-climate-cool-shadow);
        }
        .climate-item.is-cooling .climate-icon-btn {
          background: linear-gradient(135deg, #4fc3f7, #81d4fa);
          box-shadow: 0 4px 16px rgba(79, 195, 247, 0.5);
        }
        
        .climate-item.is-heating {
          background: var(--fgc-climate-heat-bg);
          border-color: var(--fgc-climate-heat-border);
          box-shadow: var(--fgc-climate-heat-shadow);
        }
        .climate-item.is-heating .climate-icon-btn {
          background: linear-gradient(135deg, #ffb74d, #ffcc80);
          box-shadow: 0 4px 16px rgba(255, 183, 77, 0.5);
        }
        
        .climate-item.is-fan-only {
          background: var(--fgc-climate-fan-bg);
          border-color: var(--fgc-climate-fan-border);
          box-shadow: var(--fgc-climate-fan-shadow);
        }
        .climate-item.is-fan-only .climate-icon-btn {
          background: linear-gradient(135deg, #bdbdbd, #e0e0e0);
          box-shadow: 0 4px 16px rgba(189, 189, 189, 0.4);
        }
        .climate-item.is-fan-only .climate-icon-btn ha-icon { color: #333; }
        
        .climate-item.is-auto {
          background: var(--fgc-climate-auto-bg);
          border-color: var(--fgc-climate-auto-border);
          box-shadow: var(--fgc-climate-auto-shadow);
        }
        .climate-item.is-auto .climate-icon-btn {
          background: linear-gradient(135deg, #9575cd, #b39ddb);
          box-shadow: 0 4px 16px rgba(149, 117, 205, 0.5);
        }
        
        .climate-item.is-dry {
          background: var(--fgc-climate-dry-bg);
          border-color: var(--fgc-climate-dry-border);
          box-shadow: var(--fgc-climate-dry-shadow);
        }
        .climate-item.is-dry .climate-icon-btn {
          background: linear-gradient(135deg, #ffa726, #ffb74d);
          box-shadow: 0 4px 16px rgba(255, 167, 38, 0.5);
        }
        
        .climate-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .climate-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--fgc-text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .climate-center-section {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 4px 0;
          flex-grow: 1;
        }
        
        .climate-center-state {
          font-size: 24px;
          font-weight: 700;
          color: var(--fgc-text-primary);
          letter-spacing: -0.5px;
          transition: all 0.15s ease;
          line-height: 1;
          text-transform: capitalize;
        }
        
        .hvac-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          background: var(--fgc-dropdown-bg);
          border: 1px solid var(--fgc-dropdown-border);
          border-radius: 12px;
          padding: 6px;
          min-width: 120px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.6);
          z-index: 9999;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-8px) scale(0.95);
          transition: all 0.15s ease;
        }
        .hvac-dropdown.show {
          opacity: 1;
          visibility: visible;
          transform: translateY(0) scale(1);
        }
        
        .hvac-option {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 11px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s;
          font-size: 12px;
          color: var(--fgc-text-primary);
        }
        .hvac-option:hover { background: var(--fgc-button-hover-bg); }
        .hvac-option.active { 
          background: rgba(0, 200, 180, 0.3); 
          color: var(--fgc-accent-secondary);
        }
        .hvac-option ha-icon {
          --mdc-icon-size: 16px;
          color: var(--fgc-text-secondary);
        }
        .hvac-option.active ha-icon { color: var(--fgc-accent-secondary); }
        
        .fan-mode-wrap {
          position: relative;
          z-index: 100;
        }
        .fan-mode-wrap.disabled {
          opacity: 0.35;
          pointer-events: none;
        }
        
        .fan-mode-btn {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          border: none;
          background: var(--fgc-button-bg);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .fan-mode-btn:hover {
          background: var(--fgc-button-hover-bg);
          transform: scale(1.08);
        }
        .fan-mode-btn:active { transform: scale(0.95); }
        .fan-mode-btn ha-icon {
          color: var(--fgc-text-secondary);
          --mdc-icon-size: 18px;
        }
        
        .climate-item.is-on .fan-mode-btn {
          background: rgba(0, 200, 180, 0.25);
          border: 1px solid rgba(0, 200, 180, 0.4);
        }
        .climate-item.is-on .fan-mode-btn ha-icon {
          color: rgba(0, 230, 200, 0.9);
        }
        .climate-item.is-on .fan-mode-btn:hover {
          background: rgba(0, 200, 180, 0.4);
          box-shadow: 0 2px 12px rgba(0, 200, 180, 0.3);
        }
        
        .climate-item.is-heating .fan-mode-btn {
          background: rgba(255, 160, 60, 0.2);
          border: 1px solid rgba(255, 170, 70, 0.4);
        }
        .climate-item.is-heating .fan-mode-btn ha-icon {
          color: rgba(255, 200, 120, 0.9);
        }
        .climate-item.is-heating .fan-mode-btn:hover {
          background: rgba(255, 160, 60, 0.35);
          box-shadow: 0 2px 12px rgba(255, 160, 60, 0.3);
        }
        
        .fan-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          background: var(--fgc-dropdown-bg);
          border: 1px solid var(--fgc-dropdown-border);
          border-radius: 12px;
          padding: 6px;
          min-width: 110px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.6);
          z-index: 9999;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-8px) scale(0.95);
          transition: all 0.15s ease;
        }
        .fan-dropdown.show {
          opacity: 1;
          visibility: visible;
          transform: translateY(0) scale(1);
        }
        
        .fan-option {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 11px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s;
          font-size: 12px;
          color: var(--fgc-text-primary);
        }
        .fan-option:hover { background: var(--fgc-button-hover-bg); }
        .fan-option.active { 
          background: rgba(0, 200, 180, 0.3); 
          color: var(--fgc-accent-secondary);
        }
        .fan-option ha-icon {
          --mdc-icon-size: 16px;
          color: var(--fgc-text-secondary);
        }
        .fan-option.active ha-icon { color: var(--fgc-accent-secondary); }
        
        .climate-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--fgc-control-bg);
          border-radius: 12px;
          padding: 8px 10px;
          gap: 8px;
          position: relative;
          z-index: 1;
          margin-top: auto;
          width: 100%;
          box-sizing: border-box;
        }
        
        .climate-controls.disabled {
          opacity: 0.35;
          pointer-events: none;
        }
        
        .temp-btn {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 10px;
          background: var(--fgc-button-bg);
          color: var(--fgc-icon-color);
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .temp-btn:hover { 
          background: var(--fgc-button-hover-bg); 
          color: var(--fgc-text-primary);
          transform: scale(1.08);
        }
        .temp-btn:active { transform: scale(0.95); }
        
        .climate-item.is-on .temp-btn.minus:hover { background: rgba(100, 220, 255, 0.4); }
        .climate-item.is-on .temp-btn.plus:hover { background: rgba(255, 160, 80, 0.4); }
        
        .temp-display {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          height: 32px;
        }
        
        .temp-track {
          position: absolute;
          left: 8px;
          right: 8px;
          height: 4px;
          background: var(--fgc-icon-bg);
          border-radius: 2px;
        }
        
        .climate-temp {
          font-size: 18px;
          font-weight: 700;
          color: var(--fgc-text-primary);
          position: relative;
          z-index: 2;
          text-shadow: 0 2px 8px rgba(0,0,0,0.4);
        }
        .climate-item.is-on .climate-temp { color: var(--fgc-text-primary); }
        .climate-controls.disabled .climate-temp { color: var(--fgc-text-tertiary); }
        
        .item.long-press-glow {
          animation: longPressGlow 0.5s ease-in-out infinite;
        }
        
        @keyframes longPressGlow {
          0%, 100% { 
            box-shadow: 0 0 0 2px rgba(0, 200, 180, 0.3), 0 0 20px rgba(0, 200, 180, 0.2);
          }
          50% { 
            box-shadow: 0 0 0 4px rgba(0, 200, 180, 0.5), 0 0 30px rgba(0, 200, 180, 0.4);
          }
        }
        
        .rename-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.2s, visibility 0.2s;
          backdrop-filter: blur(4px);
        }
        .rename-overlay.show {
          opacity: 1;
          visibility: visible;
        }
        
        .rename-popup {
          background: var(--fgc-dropdown-bg);
          border: 1px solid var(--fgc-dropdown-border);
          border-radius: 20px;
          padding: 20px;
          width: 280px;
          max-width: 90vw;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          transform: scale(0.9);
          transition: transform 0.2s;
        }
        .rename-overlay.show .rename-popup {
          transform: scale(1);
        }
        
        .rename-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--fgc-text-primary);
          margin-bottom: 16px;
          text-align: center;
        }
        
        .rename-input {
          width: 100%;
          padding: 12px 14px;
          border: 1px solid var(--fgc-dropdown-border);
          border-radius: 12px;
          background: var(--fgc-item-bg);
          color: var(--fgc-text-primary);
          font-size: 15px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .rename-input:focus {
          border-color: var(--fgc-accent-primary);
          box-shadow: 0 0 0 3px rgba(0, 137, 123, 0.15);
        }
        .rename-input::placeholder {
          color: var(--fgc-text-tertiary);
        }
        
        .rename-buttons {
          display: flex;
          gap: 10px;
          margin-top: 16px;
        }
        
        .rename-btn {
          flex: 1;
          padding: 11px 16px;
          border: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }
        
        .rename-btn.cancel {
          background: var(--fgc-button-bg);
          color: var(--fgc-text-primary);
        }
        .rename-btn.cancel:hover {
          background: var(--fgc-button-hover-bg);
        }
        
        .rename-btn.save {
          background: var(--fgc-accent-gradient);
          color: white;
        }
        .rename-btn.save:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 15px rgba(0, 200, 180, 0.3);
        }
        
        .rename-btn.reset {
          background: rgba(244, 67, 54, 0.2);
          color: rgba(244, 67, 54, 0.9);
          font-size: 12px;
          padding: 8px 12px;
        }
        .rename-btn.reset:hover {
          background: rgba(244, 67, 54, 0.3);
        }
        
        .rename-reset-row {
          margin-top: 12px;
          text-align: center;
        }
        
        .empty { text-align: center; padding: 32px 16px; }
        .empty-icon { font-size: 48px; margin-bottom: 12px; opacity: 0.3; }
        .empty-text { color: var(--fgc-text-secondary); font-size: 13px; }
        
        /* Compact Items */
        .compact-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          min-height: auto;
          cursor: pointer;
          transition: all 0.15s;
          grid-row: span 2;
        }
        .compact-item:hover {
          background: var(--fgc-button-hover-bg);
        }
        .compact-item > ha-icon {
          color: var(--fgc-icon-color);
          --mdc-icon-size: 22px;
        }
        .compact-climate.is-cooling {
          background: rgba(41, 182, 246, 0.15) !important;
          border: 1px solid #29b6f6 !important;
          box-shadow: 0 0 15px rgba(41, 182, 246, 0.6), inset 0 0 10px rgba(41, 182, 246, 0.2) !important;
        }
        .compact-climate.is-cooling > ha-icon {
          color: #29b6f6;
        }
		.compact-climate.is-heating {
          background: rgba(255, 167, 38, 0.15) !important;
          border: 1px solid #ffa726 !important;
          box-shadow: 0 0 15px rgba(255, 167, 38, 0.6), inset 0 0 10px rgba(255, 167, 38, 0.2) !important;
        }        
        .compact-climate.is-heating > ha-icon {
          color: #ffa726;
        }
        .compact-climate.is-fan-only {
          background: rgba(189, 189, 189, 0.15) !important;
          border: 1px solid #e0e0e0 !important;
          box-shadow: 0 0 12px rgba(224, 224, 224, 0.4), inset 0 0 8px rgba(224, 224, 224, 0.1) !important;
        }
        .compact-climate.is-fan-only > ha-icon {
          color: #e0e0e0 !important;
        }
        .compact-climate.is-auto {
          background: rgba(149, 117, 205, 0.15) !important;
          border: 1px solid #9575cd !important;
          box-shadow: 0 0 15px rgba(149, 117, 205, 0.6), inset 0 0 10px rgba(149, 117, 205, 0.2) !important;
        }
        .compact-climate.is-auto > ha-icon {
          color: #9575cd !important;
        }
        .compact-climate.is-dry {
          background: rgba(255, 152, 0, 0.15) !important;
          border: 1px solid #ff9800 !important;
          box-shadow: 0 0 15px rgba(255, 152, 0, 0.6), inset 0 0 10px rgba(255, 152, 0, 0.2) !important;
        }
        .compact-climate.is-dry > ha-icon {
          color: #ff9800 !important;
        }        
		.compact-cover.is-open {
          background: rgba(102, 187, 106, 0.15) !important;
          border: 1px solid #66bb6a !important; /* Bright Green */
          box-shadow: 0 0 15px rgba(102, 187, 106, 0.6), inset 0 0 10px rgba(102, 187, 106, 0.2) !important;
        }
        .compact-cover.is-open > ha-icon {
          color: #66bb6a;
        }
        .compact-info {
          flex: 1;
          min-width: 0;
        }
        .compact-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--fgc-text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .compact-state {
          font-size: 11px;
          color: var(--fgc-text-secondary);
          margin-top: 2px;
        }
        .compact-expand-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: var(--fgc-button-bg);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .compact-expand-btn:hover {
          background: var(--fgc-button-hover-bg);
          transform: scale(1.05);
        }
        .compact-expand-btn ha-icon {
          color: var(--fgc-icon-color);
          --mdc-icon-size: 18px;
        }
        
        /* Entity Picker Overlay */
        .entity-picker-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10001;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.2s, visibility 0.2s;
          backdrop-filter: blur(4px);
        }
        .entity-picker-overlay.show {
          opacity: 1;
          visibility: visible;
        }
        .entity-picker-popup {
          background: var(--fgc-dropdown-bg);
          border: 1px solid var(--fgc-dropdown-border);
          border-radius: 20px;
          padding: 20px;
          width: 320px;
          max-width: 90vw;
          max-height: 70vh;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          transform: scale(0.9);
          transition: transform 0.2s;
          display: flex;
          flex-direction: column;
        }
        .entity-picker-overlay.show .entity-picker-popup {
          transform: scale(1);
        }
        .entity-picker-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--fgc-text-primary);
          margin-bottom: 16px;
          text-align: center;
        }
        .entity-picker-search {
          width: 100%;
          padding: 12px 14px;
          border: 1px solid var(--fgc-dropdown-border);
          border-radius: 12px;
          background: var(--fgc-item-bg);
          color: var(--fgc-text-primary);
          font-size: 14px;
          outline: none;
          margin-bottom: 12px;
          box-sizing: border-box;
        }
        .entity-picker-search:focus {
          border-color: var(--fgc-accent-primary);
        }
        
        .entity-picker-filters {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch; /* Mobile momentum scrolling */
          padding-bottom: 8px; /* More space for scrollbar */
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }
        .entity-picker-filters::-webkit-scrollbar {
          height: 4px;
          display: block; /* Show scrollbar */
        }
        .entity-picker-filters::-webkit-scrollbar-track {
          background: transparent;
        }
        .entity-picker-filters::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
        .entity-picker-filters::-webkit-scrollbar-thumb:hover {
          background-color: rgba(255, 255, 255, 0.4);
        }
        
        .filter-chip {
          padding: 6px 14px;
          border-radius: 20px;
          background: var(--fgc-button-bg);
          border: 1px solid var(--fgc-item-border);
          color: var(--fgc-text-secondary);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .filter-chip:hover {
          background: var(--fgc-button-hover-bg);
          color: var(--fgc-text-primary);
        }
        .filter-chip.active {
          background: var(--fgc-accent-gradient);
          border-color: transparent;
          color: white;
          box-shadow: 0 4px 12px rgba(0, 137, 123, 0.3);
        }

        .entity-picker-list {
          flex: 1;
          overflow-y: auto;
          max-height: 300px;
        }
        .entity-picker-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .entity-picker-item:hover {
          background: var(--fgc-button-hover-bg);
        }
        .entity-picker-item ha-icon {
          color: var(--fgc-icon-color);
          --mdc-icon-size: 20px;
        }
        .entity-picker-item-name {
          flex: 1;
          font-size: 13px;
          color: var(--fgc-text-primary);
        }
        .entity-picker-item-id {
          font-size: 10px;
          color: var(--fgc-text-tertiary);
        }
        .entity-picker-close {
          margin-top: 12px;
          padding: 10px;
          border: none;
          border-radius: 10px;
          background: var(--fgc-button-bg);
          color: var(--fgc-text-primary);
          font-size: 13px;
          cursor: pointer;
        }
        .entity-picker-close:hover {
          background: var(--fgc-button-hover-bg);
        }
        
        /* Recently Removed Overlay */
        .recently-removed-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10002;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.2s, visibility 0.2s;
          backdrop-filter: blur(4px);
        }
        .recently-removed-overlay.show {
          opacity: 1;
          visibility: visible;
        }
        .recently-removed-popup {
          background: var(--fgc-dropdown-bg);
          border: 1px solid var(--fgc-dropdown-border);
          border-radius: 20px;
          padding: 20px;
          width: 300px;
          max-width: 90vw;
          max-height: 60vh;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          transform: scale(0.9);
          transition: transform 0.2s;
          display: flex;
          flex-direction: column;
        }
        .recently-removed-overlay.show .recently-removed-popup {
          transform: scale(1);
        }
        .recently-removed-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--fgc-text-primary);
          margin-bottom: 16px;
          text-align: center;
        }
        .recently-removed-list {
          flex: 1;
          overflow-y: auto;
          max-height: 250px;
        }
        .recently-removed-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          margin-bottom: 4px;
          background: var(--fgc-item-bg);
        }
        .recently-removed-item-info {
          flex: 1;
          min-width: 0;
        }
        .recently-removed-item-name {
          font-size: 13px;
          color: var(--fgc-text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .recently-removed-item-time {
          font-size: 10px;
          color: var(--fgc-text-tertiary);
        }
        .restore-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: var(--fgc-accent-gradient);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .restore-btn:hover {
          transform: scale(1.1);
        }
        .restore-btn ha-icon {
          color: white;
          --mdc-icon-size: 16px;
        }
        .recently-removed-empty {
          text-align: center;
          padding: 20px;
          color: var(--fgc-text-secondary);
          font-size: 13px;
        }
        .recently-removed-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }
        .recently-removed-btn {
          flex: 1;
          padding: 10px;
          border: none;
          border-radius: 10px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .recently-removed-btn.close {
          background: var(--fgc-button-bg);
          color: var(--fgc-text-primary);
        }
        .recently-removed-btn.close:hover {
          background: var(--fgc-button-hover-bg);
        }
        .recently-removed-btn.clear {
          background: rgba(244, 67, 54, 0.2);
          color: rgba(244, 67, 54, 0.9);
        }
        .recently-removed-btn.clear:hover {
          background: rgba(244, 67, 54, 0.3);
        }
        
        /* Control Popup - Custom Glass Style */
        .control-popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.75);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10003;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.25s, visibility 0.25s;
          backdrop-filter: blur(8px);
        }
        .control-popup-overlay.show {
          opacity: 1;
          visibility: visible;
        }
        .control-popup {
          background: var(--fgc-dropdown-bg);
          border: 1px solid var(--fgc-dropdown-border);
          border-radius: 24px;
          padding: 24px;
          width: 280px;
          max-width: 90vw;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.08);
          transform: scale(0.9) translateY(10px);
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .control-popup-overlay.show .control-popup {
          transform: scale(1) translateY(0);
        }
        .control-popup-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .control-popup-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--fgc-text-primary);
        }
        .control-popup-close {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          border: none;
          background: var(--fgc-button-bg);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .control-popup-close:hover {
          background: var(--fgc-button-hover-bg);
        }
        .control-popup-close ha-icon {
          color: var(--fgc-icon-color);
          --mdc-icon-size: 16px;
        }
        
        /* Climate Control Popup Content */
        .control-temp-section {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-bottom: 24px;
        }
        .control-temp-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid var(--fgc-item-border);
          background: var(--fgc-item-bg);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .control-temp-btn:hover {
          background: var(--fgc-button-hover-bg);
          transform: scale(1.1);
        }
        .control-temp-btn:active {
          transform: scale(0.95);
        }
        .control-temp-btn ha-icon {
          color: var(--fgc-icon-color);
          --mdc-icon-size: 20px;
        }
        .control-temp-display {
          font-size: 40px;
          font-weight: 600;
          color: var(--fgc-text-primary);
          min-width: 80px;
          text-align: center;
        }
        .control-temp-display span {
          font-size: 20px;
          opacity: 0.6;
        }
        
        .control-mode-section {
          margin-bottom: 20px;
        }
        .control-mode-label {
          font-size: 11px;
          font-weight: 500;
          color: var(--fgc-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 10px;
        }
        .control-mode-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }
        .control-mode-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 10px 4px;
          border-radius: 12px;
          border: 1px solid var(--fgc-item-border);
          background: var(--fgc-item-bg);
          cursor: pointer;
          transition: all 0.15s;
        }
        .control-mode-btn:hover {
          background: var(--fgc-button-hover-bg);
        }
        .control-mode-btn.active {
          background: var(--fgc-accent-gradient);
          border-color: transparent;
        }
        .control-mode-btn ha-icon {
          color: var(--fgc-icon-color);
          --mdc-icon-size: 18px;
        }
        .control-mode-btn.active ha-icon {
          color: white;
        }
        .control-mode-btn span {
          font-size: 9px;
          color: var(--fgc-text-secondary);
        }
        .control-mode-btn.active span {
          color: rgba(255,255,255,0.9);
        }
        
        /* Cover Control Popup Content */
        .control-cover-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }
        .control-cover-position {
          font-size: 48px;
          font-weight: 600;
          color: var(--fgc-text-primary);
        }
        .control-cover-position span {
          font-size: 18px;
          opacity: 0.6;
        }
        .control-cover-slider {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: var(--fgc-item-bg);
          appearance: none;
          outline: none;
        }
        .control-cover-slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--fgc-accent-gradient);
          cursor: pointer;
        }
        .control-cover-buttons {
          display: flex;
          gap: 12px;
        }
        .control-cover-btn {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          border: 1px solid var(--fgc-item-border);
          background: var(--fgc-item-bg);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .control-cover-btn:hover {
          background: var(--fgc-button-hover-bg);
          transform: scale(1.05);
        }
        .control-cover-btn.active {
          background: var(--fgc-accent-gradient);
          border-color: transparent;
        }
        .control-cover-btn ha-icon {
          color: var(--fgc-icon-color);
          --mdc-icon-size: 24px;
        }
        .control-cover-btn.active ha-icon {
          color: white;
        }
        
        ${customStyle}
      </style>
      
      <div class="card">
        ${this._config.title !== false ? `
          <div class="header">
            <div class="header-left">
              <button class="quick-add-btn" title="Add entity">
                <ha-icon icon="mdi:plus"></ha-icon>
              </button>
              <span class="title">${this._config.title || 'Favorites'}</span>
            </div>
            <div class="header-right">
              <!-- Selection Mode Buttons -->
              <div class="selection-header-buttons">
                <button class="selection-cancel-btn" title="Cancel selection">
                  <ha-icon icon="mdi:close"></ha-icon>
                </button>
                <button class="selection-delete-btn ${this._selectedEntities.size > 0 ? 'active' : ''}" title="Delete selected">
                  <ha-icon icon="mdi:delete"></ha-icon>
                  ${this._selectedEntities.size > 0 ? `<span class="delete-count">${this._selectedEntities.size}</span>` : ''}
                </button>
              </div>

              <!-- Normal Mode Buttons -->
              <div class="normal-header-buttons">
                <button class="auto-sort-btn" title="Auto-sort entities">
                  <ha-icon icon="mdi:sort"></ha-icon>
                </button>
                <button class="recently-removed-btn" title="Recently removed">
                  <ha-icon icon="mdi:history"></ha-icon>
                  ${this._recentlyRemoved.length > 0 ? `<span class="badge">${this._recentlyRemoved.length}</span>` : ''}
                </button>
                <button class="bulk-delete-btn" title="Select items to delete">
                  <ha-icon icon="mdi:delete-outline"></ha-icon>
                </button>
              </div>

              <span class="count">${this._favorites.length} items</span>
            </div>
          </div>
        ` : ''}
        
        ${this._favorites.length === 0 && this._config.show_empty_message ? `
          <div class="empty">
            <div class="empty-icon">⭐</div>
            <div class="empty-text">${this._config.empty_message}</div>
          </div>
        ` : `
          <div class="grid">
            ${this._favorites.map(fav => this._renderItem(fav)).join('')}
          </div>
        `}
      </div>
      
      <div class="rename-overlay">
        <div class="rename-popup">
          <div class="rename-title">Rename</div>
          <input type="text" class="rename-input" placeholder="Enter custom name...">
          <div class="rename-buttons">
            <button class="rename-btn cancel">Cancel</button>
            <button class="rename-btn save">Save</button>
          </div>
          <div class="rename-reset-row">
            <button class="rename-btn reset">Reset to Default</button>
            <button class="rename-btn delete" style="flex: 1;">Remove</button>
          </div>
        </div>
      </div>
      
      <div class="entity-picker-overlay ${this._showEntityPicker ? 'show' : ''}">
        <div class="entity-picker-popup">
          <div class="entity-picker-title">Add to Favorites</div>
          <input type="text" class="entity-picker-search" placeholder="Search entities..." value="${this._entityPickerSearch}">
          
          <div class="entity-picker-filters">
            <button class="filter-chip ${this._entityPickerFilter === 'all' ? 'active' : ''}" data-filter="all">All</button>
            <button class="filter-chip ${this._entityPickerFilter === 'light' ? 'active' : ''}" data-filter="light">Lights</button>
            <button class="filter-chip ${this._entityPickerFilter === 'climate' ? 'active' : ''}" data-filter="climate">Climate</button>
            <button class="filter-chip ${this._entityPickerFilter === 'cover' ? 'active' : ''}" data-filter="cover">Covers</button>
            <button class="filter-chip ${this._entityPickerFilter === 'switch' ? 'active' : ''}" data-filter="switch">Switches</button>
            <button class="filter-chip ${this._entityPickerFilter === 'fan' ? 'active' : ''}" data-filter="fan">Fans</button>
          </div>

          <div class="entity-picker-list">
            ${this._renderEntityPickerList()}
          </div>
          <button class="entity-picker-close">Close</button>
        </div>
      </div>
      
      <div class="recently-removed-overlay ${this._showRecentlyRemovedPopup ? 'show' : ''}">
        <div class="recently-removed-popup">
          <div class="recently-removed-title">Recently Removed</div>
          <div class="recently-removed-list">
            ${this._recentlyRemoved.length === 0 ? `
              <div class="recently-removed-empty">No recently removed items</div>
            ` : this._recentlyRemoved.map(item => `
              <div class="recently-removed-item" data-entity="${item.entity_id}">
                <div class="recently-removed-item-info">
                  <div class="recently-removed-item-name">${item.custom_name || this._getFriendlyName(item.entity_id)}</div>
                  <div class="recently-removed-item-time">${this._formatTimeAgo(item.removed_at)}</div>
                </div>
                <button class="restore-btn" data-entity="${item.entity_id}" title="Restore">
                  <ha-icon icon="mdi:restore"></ha-icon>
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      
      <div class="control-popup-overlay ${this._controlPopupEntityId ? 'show' : ''}">
        ${this._renderControlPopup()}
      </div>
    `;

    this._attachEventListeners();
  }

  _renderControlPopup() {
    if (!this._controlPopupEntityId || !this._hass) return '';

    const entity = this._hass.states[this._controlPopupEntityId];
    if (!entity) return '';

    const domain = this._controlPopupEntityId.split('.')[0];
    const name = entity.attributes?.friendly_name || this._controlPopupEntityId.split('.')[1];

    if (domain === 'climate') {
      return this._renderClimateControlPopup(entity, name);
    } else if (domain === 'cover') {
      return this._renderCoverControlPopup(entity, name);
    }
    return '';
  }

  _renderClimateControlPopup(entity, name) {
    const temp = entity.attributes?.temperature || 22;
    const mode = entity.state || 'off';
    const modes = entity.attributes?.hvac_modes || ['off', 'cool', 'heat', 'auto'];
    const fanModes = entity.attributes?.fan_modes || [];
    const currentFanMode = entity.attributes?.fan_mode || 'auto';
    const isOn = mode !== 'off' && mode !== 'unavailable';

    return `
      <div class="control-popup">
        <div class="control-popup-header">
          <div class="control-popup-title">${name}</div>
          <button class="control-popup-close">
            <ha-icon icon="mdi:close"></ha-icon>
          </button>
        </div>
        
        <div class="control-temp-section">
          <button class="control-temp-btn" data-action="temp-down">
            <ha-icon icon="mdi:minus"></ha-icon>
          </button>
          <div class="control-temp-display">${isOn ? temp : '--'}<span>°</span></div>
          <button class="control-temp-btn" data-action="temp-up">
            <ha-icon icon="mdi:plus"></ha-icon>
          </button>
        </div>
        
        <div class="control-mode-section">
          <div class="control-mode-label">Mode</div>
          <div class="control-mode-grid">
            ${modes.map(m => `
              <button class="control-mode-btn ${m === mode ? 'active' : ''}" data-mode="${m}">
                <ha-icon icon="${this._getClimateIcon(m)}"></ha-icon>
                <span>${this._getModeLabel(m)}</span>
              </button>
            `).join('')}
          </div>
        </div>
        
        ${fanModes.length > 0 ? `
          <div class="control-mode-section">
            <div class="control-mode-label">Fan</div>
            <div class="control-mode-grid">
              ${fanModes.slice(0, 4).map(fm => `
                <button class="control-mode-btn ${fm === currentFanMode ? 'active' : ''}" data-fan-mode="${fm}">
                  <ha-icon icon="${this._getFanIcon(fm)}"></ha-icon>
                  <span>${fm}</span>
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  _renderCoverControlPopup(entity, name) {
    const position = entity.attributes?.current_position ?? 100;
    const state = entity.state;

    return `
      <div class="control-popup">
        <div class="control-popup-header">
          <div class="control-popup-title">${name}</div>
          <button class="control-popup-close">
            <ha-icon icon="mdi:close"></ha-icon>
          </button>
        </div>
        
        <div class="control-cover-section">
          <div class="control-cover-position">${position}<span>%</span></div>
          
          <input type="range" class="control-cover-slider" 
                 min="0" max="100" value="${position}" 
                 data-entity="${this._controlPopupEntityId}">
          
          <div class="control-cover-buttons">
            <button class="control-cover-btn ${state === 'open' ? 'active' : ''}" data-action="open">
              <ha-icon icon="mdi:arrow-up"></ha-icon>
            </button>
            <button class="control-cover-btn" data-action="stop">
              <ha-icon icon="mdi:stop"></ha-icon>
            </button>
            <button class="control-cover-btn ${state === 'closed' ? 'active' : ''}" data-action="close">
              <ha-icon icon="mdi:arrow-down"></ha-icon>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  _renderItem(fav) {
    const domain = fav.entity_id.split('.')[0];
    const entity = this._hass?.states[fav.entity_id];

    if (domain === 'climate') {
      if (this._config.climate_compact) {
        return this._renderCompactClimateItem(fav, entity);
      }
      return this._renderClimateItem(fav, entity);
    } else if (domain === 'cover') {
      if (this._config.cover_compact) {
        return this._renderCompactCoverItem(fav, entity);
      }
      return this._renderCoverItem(fav, entity);
    } else if (domain === 'light' && this._config.light_compact) {
      return this._renderLightItem(fav, entity);
    } else {
      return this._renderStandardItem(fav, entity);
    }
  }

  _renderCompactClimateItem(fav, entity) {
    const isOn = entity && entity.state !== 'off' && entity.state !== 'unavailable';
    const mode = entity?.state || 'off';
    const temp = entity?.attributes?.temperature;
    const allowReorder = this._config.allow_reorder !== false;

    return `
      <div class="item compact-item compact-climate ${isOn ? 'is-on' : 'is-off'} ${mode === 'cool' ? 'is-cooling' : ''} ${mode === 'heat' ? 'is-heating' : ''}" 
           data-entity="${fav.entity_id}"
           ${allowReorder ? `draggable="true"` : ''}>
        <div class="selection-circle"><ha-icon icon="mdi:check"></ha-icon></div>
        <ha-icon icon="${this._getClimateIcon(mode)}"></ha-icon>
        <div class="compact-info">
          <div class="compact-name">${this._getName(fav)}</div>
          <div class="compact-state">${isOn ? `${temp}° · ${mode}` : 'Off'}</div>
        </div>
        <button class="compact-expand-btn" data-entity="${fav.entity_id}" title="Open controls">
          <ha-icon icon="mdi:chevron-right"></ha-icon>
        </button>
      </div>
    `;
  }

  _renderCompactCoverItem(fav, entity) {
    const state = entity?.state || 'unknown';
    const position = entity?.attributes?.current_position;
    const isOpen = state === 'open';
    const isClosed = state === 'closed';
    const allowReorder = this._config.allow_reorder !== false;

    return `
      <div class="item compact-item compact-cover ${isOpen ? 'is-open' : ''} ${isClosed ? 'is-closed' : ''}" 
           data-entity="${fav.entity_id}"
           ${allowReorder ? `draggable="true"` : ''}>
        <div class="selection-circle"><ha-icon icon="mdi:check"></ha-icon></div>
        <ha-icon icon="mdi:window-shutter${isClosed ? '' : '-open'}"></ha-icon>
        <div class="compact-info">
          <div class="compact-name">${this._getName(fav)}</div>
          <div class="compact-state">${position !== undefined ? `${position}%` : state}</div>
        </div>
        <button class="compact-expand-btn" data-entity="${fav.entity_id}" title="Open controls">
          <ha-icon icon="mdi:chevron-right"></ha-icon>
        </button>
      </div>
    `;
  }

  _renderEntityPickerList() {
    if (!this._hass) return '';

    const search = this._entityPickerSearch.toLowerCase();
    const favoriteIds = this._entityIds;
    const filter = this._entityPickerFilter;

    // Get all entities excluding already favorited ones
    const entities = Object.keys(this._hass.states)
      .filter(entityId => !favoriteIds.has(entityId))
      .filter(entityId => {
        // Domain Filter
        if (filter !== 'all') {
          if (!entityId.startsWith(filter + '.')) return false;
        }

        const entity = this._hass.states[entityId];
        const name = entity.attributes?.friendly_name || entityId;
        return name.toLowerCase().includes(search) || entityId.toLowerCase().includes(search);
      })
      .sort((a, b) => {
        const nameA = this._hass.states[a]?.attributes?.friendly_name || a;
        const nameB = this._hass.states[b]?.attributes?.friendly_name || b;
        return nameA.localeCompare(nameB);
      })
      .slice(0, 50);

    if (entities.length === 0) {
      return `<div class="recently-removed-empty">No entities found</div>`;
    }

    return entities.map(entityId => {
      const entity = this._hass.states[entityId];
      const name = entity.attributes?.friendly_name || entityId;
      const domain = entityId.split('.')[0];
      const icon = this._getDomainIcon(domain, entity);

      return `
        <div class="entity-picker-item" data-entity="${entityId}">
          <ha-icon icon="${icon}"></ha-icon>
          <div class="entity-picker-item-name">
            ${name}
            <div class="entity-picker-item-id">${entityId}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  _getFriendlyName(entityId) {
    const entity = this._hass?.states[entityId];
    return entity?.attributes?.friendly_name || entityId.split('.')[1]?.replace(/_/g, ' ') || entityId;
  }

  _formatTimeAgo(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  _getDomainIcon(domain, entity) {
    const icons = {
      light: 'mdi:lightbulb',
      switch: 'mdi:light-switch',
      climate: 'mdi:thermostat',
      cover: 'mdi:window-shutter',
      sensor: 'mdi:eye',
      binary_sensor: 'mdi:checkbox-blank-circle',
      fan: 'mdi:fan',
      media_player: 'mdi:cast',
      camera: 'mdi:cctv',
      lock: 'mdi:lock',
      script: 'mdi:script',
      automation: 'mdi:robot',
      scene: 'mdi:palette'
    };
    return entity?.attributes?.icon || icons[domain] || 'mdi:help-circle';
  }


  _renderClimateItem(fav, entity) {
    const isOn = entity && entity.state !== 'off' && entity.state !== 'unavailable';
    const mode = entity?.state || 'off';
    const temp = entity?.attributes?.temperature;
    const modes = entity?.attributes?.hvac_modes || ['off', 'cool', 'heat', 'auto'];
    const fanModes = entity?.attributes?.fan_modes || [];
    const currentFanMode = entity?.attributes?.fan_mode || 'auto';
    const allowReorder = this._config.allow_reorder !== false;

    let stateLabel = mode;
    if (isOn) {
      if (fanModes.length > 0 && currentFanMode) {
        stateLabel = `${mode} · ${currentFanMode}`;
      }
    } else {
      stateLabel = 'Off';
    }

    return `
      <div class="item climate-item ${isOn ? 'is-on' : 'is-off'} ${mode === 'cool' ? 'is-cooling' : ''} ${mode === 'heat' ? 'is-heating' : ''}" 
           data-entity="${fav.entity_id}"
           ${allowReorder ? `draggable="true"` : ''}>
        <div class="selection-circle"><ha-icon icon="mdi:check"></ha-icon></div>
        
        <div class="climate-header">
          <div class="climate-left">
            <div class="climate-icon-wrap">
              <button class="climate-icon-btn" data-entity="${fav.entity_id}">
                <ha-icon icon="${this._getClimateIcon(mode)}"></ha-icon>
              </button>
              <div class="hvac-dropdown">
                ${modes.map(m => `
                  <div class="hvac-option ${m === mode ? 'active' : ''}" data-mode="${m}" data-entity="${fav.entity_id}">
                    <ha-icon icon="${this._getClimateIcon(m)}"></ha-icon>
                    <span>${this._getModeLabel(m)}</span>
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="climate-info">
              <div class="climate-name">${this._getName(fav)}</div>
            </div>
          </div>
          
          ${fanModes.length > 0 ? `
            <div class="fan-mode-wrap ${!isOn ? 'disabled' : ''}">
              <button class="fan-mode-btn" data-entity="${fav.entity_id}" ${!isOn ? 'disabled' : ''}>
                <ha-icon icon="${this._getFanIcon(currentFanMode)}"></ha-icon>
              </button>
              <div class="fan-dropdown">
                ${fanModes.map(fm => `
                  <div class="fan-option ${fm === currentFanMode ? 'active' : ''}" data-fan-mode="${fm}" data-entity="${fav.entity_id}">
                    <ha-icon icon="${this._getFanIcon(fm)}"></ha-icon>
                    <span>${this._getFanModeLabel(fm)}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
        
        <div class="climate-center-section">
          <span class="climate-center-state">${stateLabel}</span>
        </div>
        
        ${this._config.show_climate_controls ? `
          <div class="climate-controls ${!isOn ? 'disabled' : ''}">
            <button class="temp-btn minus" data-entity="${fav.entity_id}" data-delta="-1">−</button>
            <div class="temp-display">
              <div class="temp-track"></div>
              <span class="climate-temp">${isOn && temp ? `${temp}°` : '--'}</span>
            </div>
            <button class="temp-btn plus" data-entity="${fav.entity_id}" data-delta="1">+</button>
          </div>
        ` : ''}
      </div>
    `;
  }

  _renderLightItem(fav, entity) {
    const isOn = entity?.state === 'on';
    const allowReorder = this._config.allow_reorder !== false;

    return `
      <div class="item light-item ${isOn ? 'is-on' : ''}" 
           data-entity="${fav.entity_id}"
           ${allowReorder ? `draggable="true"` : ''}>
        <div class="selection-circle"><ha-icon icon="mdi:check"></ha-icon></div>
        <div class="icon-wrap">
          <ha-icon icon="${this._getIcon(fav)}"></ha-icon>
        </div>
        <div class="item-info">
          <div class="name">${this._getName(fav)}</div>
          <div class="state">${isOn ? 'On' : 'Off'}</div>
        </div>
      </div>
    `;
  }

  _renderCoverItem(fav, entity) {
    const state = entity?.state || 'unavailable';
    const position = entity?.attributes?.current_position;

    const isClosed = state === 'closed';
    const isMoving = state === 'opening' || state === 'closing';
    const isOpen = !isClosed && !isMoving && state !== 'unavailable';

    const allowReorder = this._config.allow_reorder !== false;
    const showControls = this._config.show_cover_controls !== false;

    let stateLabel = state;
    if (isClosed) {
      stateLabel = 'Closed';
    } else if (isMoving) {
      stateLabel = state === 'opening' ? 'Opening' : 'Closing';
    } else if (isOpen) {
      if (position !== undefined && position !== null && typeof position === 'number') {
        stateLabel = position === 100 ? 'Open' : position === 0 ? 'Closed' : `${Math.round(position)}%`;
      } else {
        stateLabel = 'Open';
      }
    } else {
      stateLabel = state.charAt(0).toUpperCase() + state.slice(1);
    }

    const isFullyOpen = position === 100 || (position === undefined && state === 'open');

    return `
      <div class="item cover-item ${isOpen ? 'is-open' : ''} ${isClosed ? 'is-closed' : ''} ${isMoving ? 'is-moving' : ''}" 
           data-entity="${fav.entity_id}"
           ${allowReorder ? `draggable="true"` : ''}>
        <div class="selection-circle"><ha-icon icon="mdi:check"></ha-icon></div>
        
        <div class="cover-header">
          <div class="cover-info">
            <div class="cover-name-row">
              <div class="cover-icon-wrap">
                <ha-icon icon="${this._getCoverIcon(state, position)}"></ha-icon>
              </div>
              <div class="cover-name">${this._getName(fav)}</div>
            </div>
          </div>
        </div>
        
        <div class="cover-center-section">
          <span class="cover-center-state">${stateLabel}</span>
        </div>
        
        ${showControls ? `
          <div class="cover-controls-container">
            <div class="cover-controls-row">
              <button class="cover-control-btn close ${isClosed ? 'disabled' : ''}" data-entity="${fav.entity_id}" data-action="close" title="Close">
                <ha-icon icon="mdi:arrow-collapse-horizontal"></ha-icon>
              </button>
              
              <button class="cover-control-btn pause" data-entity="${fav.entity_id}" data-action="stop" title="Stop">
                <ha-icon icon="mdi:pause"></ha-icon>
              </button>
              
              <button class="cover-control-btn open ${isFullyOpen ? 'disabled' : ''}" data-entity="${fav.entity_id}" data-action="open" title="Open">
                <ha-icon icon="mdi:arrow-expand-horizontal"></ha-icon>
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  _renderStandardItem(fav, entity) {
    const isOn = ['on', 'home', 'playing', 'open', 'unlocked', 'heat', 'cool'].includes(entity?.state);
    const allowReorder = this._config.allow_reorder !== false;

    return `
      <div class="item standard-item ${isOn ? 'is-on' : ''}" 
           data-entity="${fav.entity_id}"
           ${allowReorder ? `draggable="true"` : ''}>
        <div class="selection-circle"><ha-icon icon="mdi:check"></ha-icon></div>
        <div class="item-top">
          <div class="icon-wrap">
            <ha-icon icon="${this._getIcon(fav)}"></ha-icon>
          </div>
          <div class="item-info">
            <div class="name">${this._getName(fav)}</div>
            <div class="state">${entity?.state || 'unavailable'}</div>
          </div>
        </div>
      </div>
    `;
  }

  _attachEventListeners() {
    const allowReorder = this._config.allow_reorder !== false;

    this.shadowRoot.querySelectorAll('.light-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if (this._isSelectionMode) {
          this._toggleItemSelection(el.dataset.entity, el);
          return;
        }
        if (!this._draggedItem) {
          this._toggleLight(el.dataset.entity, e);
        }
      });
    });

    this.shadowRoot.querySelectorAll('.standard-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if (this._isSelectionMode) {
          this._toggleItemSelection(el.dataset.entity, el);
          return;
        }
        if (!this._draggedItem) {
          this._toggleEntity(el.dataset.entity);
        }
      });
    });

    // Climate/Cover items don't have a generic click handler normally, 
    // but need one for selection mode
    this.shadowRoot.querySelectorAll('.climate-item, .cover-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if (this._isSelectionMode) {
          this._toggleItemSelection(el.dataset.entity, el);
        }
      });
    });

    // Compact expand buttons (open control popup)
    this.shadowRoot.querySelectorAll('.compact-expand-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const entityId = btn.dataset.entity;
        if (entityId) {
          this._showControlPopup(entityId);
        }
      });
    });

    // Also allow clicking the compact item itself to open popup
    this.shadowRoot.querySelectorAll('.compact-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if (this._isSelectionMode) {
          this._toggleItemSelection(el.dataset.entity, el);
          return;
        }
        if (!this._draggedItem && !e.target.closest('.compact-expand-btn')) {
          this._showControlPopup(el.dataset.entity);
        }
      });
    });

    this.shadowRoot.querySelectorAll('.climate-icon-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this._toggleClimateDropdown(btn.dataset.entity, e);
      });
    });

    this.shadowRoot.querySelectorAll('.hvac-option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        this._setHvacMode(opt.dataset.entity, opt.dataset.mode, e);
      });
    });

    this.shadowRoot.querySelectorAll('.fan-mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this._toggleFanDropdown(btn.dataset.entity, e);
      });
    });

    this.shadowRoot.querySelectorAll('.fan-option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        this._setFanMode(opt.dataset.entity, opt.dataset.fanMode, e);
      });
    });

    this.shadowRoot.querySelectorAll('.temp-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this._climateSetTemp(btn.dataset.entity, parseInt(btn.dataset.delta), e);
      });
    });

    this.shadowRoot.querySelectorAll('.cover-control-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this._coverControl(btn.dataset.entity, btn.dataset.action, e);
      });
    });

    if (allowReorder) {
      this.shadowRoot.querySelectorAll('.item').forEach(el => {
        el.addEventListener('dragstart', (e) => this._handleDragStart(e, el.dataset.entity));
        el.addEventListener('dragend', (e) => this._handleDragEnd(e));
        el.addEventListener('dragover', (e) => this._handleDragOver(e, el.dataset.entity));
        el.addEventListener('drop', (e) => this._handleDrop(e, el.dataset.entity));
      });
    }

    this.shadowRoot.querySelectorAll('.item').forEach(el => {
      el.addEventListener('pointerdown', (e) => this._handlePointerDown(e, el));
      el.addEventListener('pointermove', (e) => this._handlePointerMove(e));
      el.addEventListener('pointerup', (e) => this._handlePointerUp(e));
      el.addEventListener('pointercancel', (e) => this._handlePointerUp(e));
      el.addEventListener('pointerleave', (e) => this._handlePointerUp(e));
    });

    const overlay = this.shadowRoot.querySelector('.rename-overlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this._hideRenamePopup();
      });
    }

    const cancelBtn = this.shadowRoot.querySelector('.rename-btn.cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this._hideRenamePopup());
    }

    const saveBtn = this.shadowRoot.querySelector('.rename-btn.save');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this._saveRename());
    }

    const resetBtn = this.shadowRoot.querySelector('.rename-btn.reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this._resetRename());
    }

    const input = this.shadowRoot.querySelector('.rename-input');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this._saveRename();
        if (e.key === 'Escape') this._hideRenamePopup();
      });
    }

    // Quick Add Button
    const quickAddBtn = this.shadowRoot.querySelector('.quick-add-btn');
    if (quickAddBtn) {
      quickAddBtn.addEventListener('click', () => {
        this._showEntityPicker = true;
        this._entityPickerSearch = '';
        this._smartRender();
        setTimeout(() => {
          const searchInput = this.shadowRoot.querySelector('.entity-picker-search');
          if (searchInput) searchInput.focus();
        }, 100);
      });
    }

    // Auto Sort Button
    const autoSortBtn = this.shadowRoot.querySelector('.auto-sort-btn');
    if (autoSortBtn) {
      autoSortBtn.addEventListener('click', () => {
        this._autoSort();
      });
    }

    // Recently Removed Button
    const recentlyRemovedBtn = this.shadowRoot.querySelector('.recently-removed-btn');
    if (recentlyRemovedBtn) {
      recentlyRemovedBtn.addEventListener('click', () => {
        this._showRecentlyRemovedPopup = true;
        this._smartRender();
      });
    }

    // Bulk Delete Button - Enter selection mode
    const bulkDeleteBtn = this.shadowRoot.querySelector('.bulk-delete-btn');
    if (bulkDeleteBtn) {
      bulkDeleteBtn.addEventListener('click', () => {
        this._toggleSelectionMode(true);
      });
    }

    // Selection Cancel Button - Exit selection mode
    const selectionCancelBtn = this.shadowRoot.querySelector('.selection-cancel-btn');
    if (selectionCancelBtn) {
      selectionCancelBtn.addEventListener('click', () => {
        this._toggleSelectionMode(false);
      });
    }

    // Selection Delete Button - Perform bulk delete
    const selectionDeleteBtn = this.shadowRoot.querySelector('.selection-delete-btn');
    if (selectionDeleteBtn) {
      selectionDeleteBtn.addEventListener('click', () => {
        this._performBulkDelete();
      });
    }

    // Entity Picker Overlay
    const entityPickerOverlay = this.shadowRoot.querySelector('.entity-picker-overlay');
    if (entityPickerOverlay) {
      entityPickerOverlay.addEventListener('click', (e) => {
        if (e.target === entityPickerOverlay) {
          this._showEntityPicker = false;
          this._smartRender();
        }
      });
    }

    // Entity Picker Search
    const pickerSearch = this.shadowRoot.querySelector('.entity-picker-search');
    if (pickerSearch) {
      pickerSearch.addEventListener('input', (e) => {
        this._entityPickerSearch = e.target.value;
        const list = this.shadowRoot.querySelector('.entity-picker-list');
        if (list) {
          list.innerHTML = this._renderEntityPickerList();
          this._attachEntityPickerItemListeners();
        }
      });
    }

    // Entity Picker Filters
    this.shadowRoot.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        // Update active state visually immediately for responsiveness
        this.shadowRoot.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');

        // Update state and re-render list
        this._entityPickerFilter = e.target.dataset.filter;
        const list = this.shadowRoot.querySelector('.entity-picker-list');
        if (list) {
          list.innerHTML = this._renderEntityPickerList();
          this._attachEntityPickerItemListeners();
        }
      });
    });

    // Entity Picker Close
    const pickerClose = this.shadowRoot.querySelector('.entity-picker-close');
    if (pickerClose) {
      pickerClose.addEventListener('click', () => {
        this._showEntityPicker = false;
        this._smartRender();
      });
    }

    // Attach entity picker item listeners
    this._attachEntityPickerItemListeners();

    // Recently Removed Overlay
    const recentlyRemovedOverlay = this.shadowRoot.querySelector('.recently-removed-overlay');
    if (recentlyRemovedOverlay) {
      recentlyRemovedOverlay.addEventListener('click', (e) => {
        if (e.target === recentlyRemovedOverlay) {
          this._showRecentlyRemovedPopup = false;
          this._smartRender();
        }
      });
    }

    // Recently Removed Close Button
    const recentlyRemovedClose = this.shadowRoot.querySelector('.recently-removed-btn.close');
    if (recentlyRemovedClose) {
      recentlyRemovedClose.addEventListener('click', () => {
        this._showRecentlyRemovedPopup = false;
        this._smartRender();
      });
    }

    // Recently Removed Clear Button
    const recentlyRemovedClear = this.shadowRoot.querySelector('.recently-removed-btn.clear');
    if (recentlyRemovedClear) {
      recentlyRemovedClear.addEventListener('click', () => {
        this._clearRecentlyRemoved();
      });
    }

    // Restore Buttons
    this.shadowRoot.querySelectorAll('.restore-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const entityId = btn.dataset.entity;
        if (entityId) {
          this._restoreEntity(entityId);
        }
      });
    });

    // Control Popup Overlay
    const controlPopupOverlay = this.shadowRoot.querySelector('.control-popup-overlay');
    if (controlPopupOverlay) {
      controlPopupOverlay.addEventListener('click', (e) => {
        if (e.target === controlPopupOverlay) {
          this._controlPopupEntityId = null;
          this._smartRender();
        }
      });
    }

    // Control Popup Close Button
    const controlPopupClose = this.shadowRoot.querySelector('.control-popup-close');
    if (controlPopupClose) {
      controlPopupClose.addEventListener('click', () => {
        this._controlPopupEntityId = null;
        this._smartRender();
      });
    }

    // Control Popup Temperature Buttons
    this.shadowRoot.querySelectorAll('.control-temp-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action === 'temp-up') {
          this._controlPopupTempChange(1);
        } else if (action === 'temp-down') {
          this._controlPopupTempChange(-1);
        }
      });
    });

    // Control Popup Mode Buttons
    this.shadowRoot.querySelectorAll('.control-popup .control-mode-btn[data-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        if (mode && this._controlPopupEntityId) {
          this._hass.callService('climate', 'set_hvac_mode', {
            entity_id: this._controlPopupEntityId,
            hvac_mode: mode
          });
        }
      });
    });

    // Control Popup Fan Mode Buttons
    this.shadowRoot.querySelectorAll('.control-popup .control-mode-btn[data-fan-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        const fanMode = btn.dataset.fanMode;
        if (fanMode && this._controlPopupEntityId) {
          this._hass.callService('climate', 'set_fan_mode', {
            entity_id: this._controlPopupEntityId,
            fan_mode: fanMode
          });
        }
      });
    });

    // Control Popup Cover Buttons
    this.shadowRoot.querySelectorAll('.control-cover-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action && this._controlPopupEntityId) {
          this._hass.callService('cover', `${action}_cover`, {
            entity_id: this._controlPopupEntityId
          });
        }
      });
    });

    // Control Popup Cover Slider
    const coverSlider = this.shadowRoot.querySelector('.control-cover-slider');
    if (coverSlider) {
      coverSlider.addEventListener('change', (e) => {
        const position = parseInt(e.target.value);
        if (this._controlPopupEntityId) {
          this._hass.callService('cover', 'set_cover_position', {
            entity_id: this._controlPopupEntityId,
            position: position
          });
        }
      });
    }
  }

  _controlPopupTempChange(delta) {
    if (!this._controlPopupEntityId || !this._hass) return;
    const entity = this._hass.states[this._controlPopupEntityId];
    if (!entity) return;

    const currentTemp = entity.attributes?.temperature || 22;
    const newTemp = currentTemp + delta;

    this._hass.callService('climate', 'set_temperature', {
      entity_id: this._controlPopupEntityId,
      temperature: newTemp
    });
  }

  _showControlPopup(entityId) {
    this._controlPopupEntityId = entityId;
    this._smartRender();
  }

  _attachEntityPickerItemListeners() {
    this.shadowRoot.querySelectorAll('.entity-picker-item').forEach(item => {
      item.addEventListener('click', () => {
        const entityId = item.dataset.entity;
        if (entityId) {
          this._addFavorite(entityId);
          this._showEntityPicker = false;
          this._smartRender();
        }
      });
    });
  }

  _addFavorite(entityId) {
    if (!this._hass || !this._userId) return;

    this._hass.callService('favorites', 'add', {
      user_id: this._userId,
      entity_id: entityId
    });
  }

  _restoreEntity(entityId) {
    if (!this._hass || !this._userId) return;

    this._hass.callService('favorites', 'restore', {
      user_id: this._userId,
      entity_id: entityId
    });

    // Optimistically update UI
    this._recentlyRemoved = this._recentlyRemoved.filter(item => item.entity_id !== entityId);
    this._smartRender();
  }

  _clearRecentlyRemoved() {
    if (!this._hass || !this._userId) return;

    this._hass.callService('favorites', 'clear_recently_removed', {
      user_id: this._userId
    });

    this._recentlyRemoved = [];
    this._showRecentlyRemovedPopup = false;
    this._smartRender();
  }

  // ============================================
  // LONG PRESS TO RENAME
  // ============================================
  _handlePointerDown(e, el) {
    if (e.target.closest('button') || e.target.closest('.hvac-dropdown') || e.target.closest('.fan-dropdown')) {
      return;
    }

    const entityId = el.dataset.entity;
    if (!entityId) return;

    this._longPressStartPos = { x: e.clientX, y: e.clientY };
    this._longPressEntity = entityId;
    this._isLongPressing = false;

    this._longPressGlowTimer = setTimeout(() => {
      el.classList.add('long-press-glow');
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }
    }, 1000);

    this._longPressTimer = setTimeout(() => {
      this._isLongPressing = true;
      el.classList.remove('long-press-glow');

      if (navigator.vibrate) {
        navigator.vibrate([50, 30, 50]);
      }

      this._showRenamePopup(entityId);
    }, 4000);
  }

  _handlePointerMove(e) {
    if (!this._longPressStartPos) return;

    const dx = Math.abs(e.clientX - this._longPressStartPos.x);
    const dy = Math.abs(e.clientY - this._longPressStartPos.y);

    if (dx > 10 || dy > 10) {
      this._cancelLongPress();
    }
  }

  _handlePointerUp(e) {
    this._cancelLongPress();
  }

  _cancelLongPress() {
    if (this._longPressTimer) {
      clearTimeout(this._longPressTimer);
      this._longPressTimer = null;
    }
    if (this._longPressGlowTimer) {
      clearTimeout(this._longPressGlowTimer);
      this._longPressGlowTimer = null;
    }

    this.shadowRoot.querySelectorAll('.item.long-press-glow').forEach(el => {
      el.classList.remove('long-press-glow');
    });

    this._longPressStartPos = null;
    this._longPressEntity = null;
  }

  _showRenamePopup(entityId) {
    this._renameEntityId = entityId;

    const fav = this._favorites.find(f => f.entity_id === entityId);
    const entity = this._hass?.states[entityId];
    const currentName = fav?.custom_name || entity?.attributes?.friendly_name || entityId.split('.')[1].replace(/_/g, ' ');

    const overlay = this.shadowRoot.querySelector('.rename-overlay');
    const input = this.shadowRoot.querySelector('.rename-input');

    if (input) {
      input.value = currentName;
      input.placeholder = entity?.attributes?.friendly_name || entityId;
    }

    if (overlay) {
      overlay.classList.add('show');
      setTimeout(() => input?.focus(), 200);
    }
  }

  _hideRenamePopup() {
    const overlay = this.shadowRoot.querySelector('.rename-overlay');
    if (overlay) {
      overlay.classList.remove('show');
    }
    this._renameEntityId = null;
    this._isLongPressing = false;
  }

  async _saveRename() {
    if (!this._renameEntityId || !this._hass || !this._userId) {
      this._hideRenamePopup();
      return;
    }

    const input = this.shadowRoot.querySelector('.rename-input');
    const newName = input?.value?.trim();

    if (!newName) {
      this._hideRenamePopup();
      return;
    }

    const fav = this._favorites.find(f => f.entity_id === this._renameEntityId);
    if (fav) {
      fav.custom_name = newName;
      const item = this.shadowRoot.querySelector(`[data-entity="${this._renameEntityId}"]`);
      const nameEl = item?.querySelector('.name, .climate-name, .cover-name');
      if (nameEl) nameEl.textContent = newName;
    }

    try {
      await this._hass.callService('favorites', 'update', {
        user_id: this._userId,
        entity_id: this._renameEntityId,
        custom_name: newName,
      });
    } catch (error) {
      console.error('[favorites-grid-card] Error renaming:', error);
    }

    this._hideRenamePopup();
  }

  async _resetRename() {
    if (!this._renameEntityId || !this._hass || !this._userId) {
      this._hideRenamePopup();
      return;
    }

    const fav = this._favorites.find(f => f.entity_id === this._renameEntityId);
    const entity = this._hass?.states[this._renameEntityId];
    const defaultName = entity?.attributes?.friendly_name || this._renameEntityId.split('.')[1].replace(/_/g, ' ');

    if (fav) {
      fav.custom_name = null;
      const item = this.shadowRoot.querySelector(`[data-entity="${this._renameEntityId}"]`);
      const nameEl = item?.querySelector('.name, .climate-name, .cover-name');
      if (nameEl) nameEl.textContent = defaultName;
    }

    try {
      await this._hass.callService('favorites', 'update', {
        user_id: this._userId,
        entity_id: this._renameEntityId,
        custom_name: null,
      });
    } catch (error) {
      console.error('[favorites-grid-card] Error resetting name:', error);
    }

    this._hideRenamePopup();
  }

  getCardSize() {
    return Math.ceil(this._favorites.length / (this._config.columns || 2)) * 2 + 1;
  }
}

if (!customElements.get('favorites-grid-card')) {
  customElements.define('favorites-grid-card', FavoritesGridCard);
}

window.customCards = window.customCards || [];
if (!window.customCards.find(c => c.type === 'favorites-grid-card')) {
  window.customCards.push({
    type: 'favorites-grid-card',
    name: 'Favorites Grid Card',
    description: 'Displays favorites with theme support, climate controls, light styling, and drag-drop reorder',
    preview: true,
    documentationURL: 'https://github.com/your-repo/favorites-grid-card',
  });
}

console.info('%c FAVORITES-GRID-CARD %c v3.0.0 ', 'background: #00897b; color: white; font-weight: bold;', 'background: #00acc1; color: white;');
