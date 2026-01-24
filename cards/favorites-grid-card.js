/**
 * Favorites Grid Card for Home Assistant
 * v3.0.0 - Theme Support & Visual Configuration Editor
 * 
 * Features:
 * - 4 Theme options: Dark (frosted glass), Light (frosted glass), Liquid Glass, Native
 * - Visual configuration editor
 * - card-mod compatibility
 * - user_id filtering
 * - light/climate/cover styling
 * - fan mode dropdown
 * - rename popup (long-press)
 * - drag-drop reorder
 */

// ============================================
// CONFIGURATION EDITOR
// ============================================
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
        <label for="show_climate_controls">Show climate controls</label>
      </div>
      
      <div class="editor-row checkbox-row">
        <input type="checkbox" id="show_cover_controls" ${this._config.show_cover_controls !== false ? 'checked' : ''}>
        <label for="show_cover_controls">Show cover controls</label>
      </div>
      
      <div class="editor-row checkbox-row">
        <input type="checkbox" id="light_compact" ${this._config.light_compact !== false ? 'checked' : ''}>
        <label for="light_compact">Compact light cards</label>
      </div>
      
      <div class="editor-row checkbox-row">
        <input type="checkbox" id="allow_reorder" ${this._config.allow_reorder !== false ? 'checked' : ''}>
        <label for="allow_reorder">Allow drag-drop reorder</label>
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
    // Theme selector
    this.shadowRoot.querySelectorAll('.theme-option').forEach(el => {
      el.addEventListener('click', () => {
        this._updateConfig('theme', el.dataset.theme);
        this._render();
      });
    });
    
    // Text inputs
    ['title', 'empty_message'].forEach(id => {
      const input = this.shadowRoot.getElementById(id);
      if (input) {
        input.addEventListener('input', (e) => {
          this._updateConfig(id, e.target.value);
        });
      }
    });
    
    // Number inputs
    ['columns'].forEach(id => {
      const input = this.shadowRoot.getElementById(id);
      if (input) {
        input.addEventListener('change', (e) => {
          this._updateConfig(id, parseInt(e.target.value) || 2);
        });
      }
    });
    
    // Checkboxes
    ['show_empty_message', 'show_climate_controls', 'show_cover_controls', 'light_compact', 'allow_reorder'].forEach(id => {
      const input = this.shadowRoot.getElementById(id);
      if (input) {
        input.addEventListener('change', (e) => {
          this._updateConfig(id, e.target.checked);
        });
      }
    });
    
    // Custom CSS
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


// ============================================
// MAIN CARD
// ============================================
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
    
    // Long-press rename properties
    this._longPressTimer = null;
    this._longPressGlowTimer = null;
    this._longPressStartPos = null;
    this._longPressEntity = null;
    this._isLongPressing = false;
    this._renameEntityId = null;
  }

  // Static method for visual editor
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

  // ============================================
  // THEME STYLES
  // ============================================
  _getThemeStyles() {
    const theme = this._config.theme || 'dark';
    
    const themes = {
      dark: `
        /* Dark Frosted Glass Theme */
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
        
        --fgc-light-on-bg: linear-gradient(135deg, rgba(255, 180, 80, 0.35), rgba(255, 220, 120, 0.2));
        --fgc-light-on-border: rgba(255, 190, 90, 0.5);
        --fgc-light-on-shadow: 0 4px 20px rgba(255, 160, 60, 0.25), inset 0 1px 0 rgba(255,255,255,0.1);
        --fgc-light-on-icon-bg: linear-gradient(135deg, #ffb347, #ffcc70);
        --fgc-light-on-icon-shadow: 0 2px 12px rgba(255, 170, 60, 0.6);
        
        --fgc-climate-cool-bg: linear-gradient(135deg, rgba(40, 45, 50, 0.7), rgba(0, 180, 220, 0.25));
        --fgc-climate-cool-border: rgba(0, 200, 240, 0.4);
        --fgc-climate-heat-bg: linear-gradient(135deg, rgba(45, 40, 35, 0.7), rgba(255, 160, 60, 0.2));
        --fgc-climate-heat-border: rgba(255, 170, 70, 0.4);
        
        --fgc-cover-open-bg: linear-gradient(135deg, rgba(92, 107, 192, 0.25), rgba(121, 134, 203, 0.15));
        --fgc-cover-open-border: rgba(92, 107, 192, 0.4);
      `,
      
      light: `
        /* Light Frosted Glass Theme */
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
        
        --fgc-light-on-bg: linear-gradient(135deg, rgba(255, 193, 7, 0.25), rgba(255, 224, 130, 0.2));
        --fgc-light-on-border: rgba(255, 160, 0, 0.4);
        --fgc-light-on-shadow: 0 4px 20px rgba(255, 160, 0, 0.15), inset 0 1px 0 rgba(255,255,255,0.5);
        --fgc-light-on-icon-bg: linear-gradient(135deg, #ffa726, #ffcc02);
        --fgc-light-on-icon-shadow: 0 2px 12px rgba(255, 160, 0, 0.4);
        
        --fgc-climate-cool-bg: linear-gradient(135deg, rgba(227, 242, 253, 0.9), rgba(179, 229, 252, 0.6));
        --fgc-climate-cool-border: rgba(3, 169, 244, 0.3);
        --fgc-climate-heat-bg: linear-gradient(135deg, rgba(255, 243, 224, 0.9), rgba(255, 224, 178, 0.6));
        --fgc-climate-heat-border: rgba(255, 152, 0, 0.3);
        
        --fgc-cover-open-bg: linear-gradient(135deg, rgba(232, 234, 246, 0.9), rgba(197, 202, 233, 0.6));
        --fgc-cover-open-border: rgba(92, 107, 192, 0.3);
      `,
      
      liquid: `
        /* Liquid Glass Theme (50% transparency) */
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
        
        --fgc-light-on-bg: linear-gradient(135deg, rgba(255, 193, 7, 0.3), rgba(255, 235, 59, 0.15));
        --fgc-light-on-border: rgba(255, 193, 7, 0.5);
        --fgc-light-on-shadow: 0 4px 24px rgba(255, 193, 7, 0.3), inset 0 0 0 1px rgba(255,255,255,0.15);
        --fgc-light-on-icon-bg: linear-gradient(135deg, #ffca28, #ffe082);
        --fgc-light-on-icon-shadow: 0 2px 16px rgba(255, 193, 7, 0.5);
        
        --fgc-climate-cool-bg: linear-gradient(135deg, rgba(0, 188, 212, 0.2), rgba(77, 208, 225, 0.1));
        --fgc-climate-cool-border: rgba(0, 188, 212, 0.4);
        --fgc-climate-heat-bg: linear-gradient(135deg, rgba(255, 152, 0, 0.2), rgba(255, 183, 77, 0.1));
        --fgc-climate-heat-border: rgba(255, 152, 0, 0.4);
        
        --fgc-cover-open-bg: linear-gradient(135deg, rgba(92, 107, 192, 0.2), rgba(121, 134, 203, 0.1));
        --fgc-cover-open-border: rgba(92, 107, 192, 0.4);
      `,
      
      native: `
        /* Native Home Assistant Theme */
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
        
        --fgc-light-on-bg: var(--state-light-active-color, rgba(255, 214, 0, 0.2));
        --fgc-light-on-border: var(--state-light-active-color, rgba(255, 214, 0, 0.4));
        --fgc-light-on-shadow: none;
        --fgc-light-on-icon-bg: var(--state-light-active-color, #ffd600);
        --fgc-light-on-icon-shadow: none;
        
        --fgc-climate-cool-bg: var(--state-climate-cool-color, rgba(33, 150, 243, 0.1));
        --fgc-climate-cool-border: var(--state-climate-cool-color, rgba(33, 150, 243, 0.3));
        --fgc-climate-heat-bg: var(--state-climate-heat-color, rgba(255, 152, 0, 0.1));
        --fgc-climate-heat-border: var(--state-climate-heat-color, rgba(255, 152, 0, 0.3));
        
        --fgc-cover-open-bg: var(--state-cover-open-color, rgba(63, 81, 181, 0.1));
        --fgc-cover-open-border: var(--state-cover-open-color, rgba(63, 81, 181, 0.3));
      `,
    };
    
    return themes[theme] || themes.dark;
  }

  // ============================================
  // SYNC LOGIC
  // ============================================
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
    this._smartRender();
  }

  _smartRender() {
    const newKey = this._favorites.map(f => f.entity_id).join(',') + '_' + (this._config.theme || 'dark');
    
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
        item.classList.toggle('is-off', !isOn);
        
        const modeEl = item.querySelector('.climate-mode');
        if (modeEl) {
          modeEl.textContent = isOn && fanModes.length > 0 && fanMode 
            ? `${mode} · ${fanMode}` 
            : (mode || 'off');
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
        const isOpen = state === 'open' || (position !== undefined && position > 0);
        const isClosed = state === 'closed' || position === 0;
        const isMoving = state === 'opening' || state === 'closing';
        
        item.classList.toggle('is-open', isOpen && !isMoving);
        item.classList.toggle('is-closed', isClosed && !isMoving);
        item.classList.toggle('is-moving', isMoving);
        
        const stateEl = item.querySelector('.cover-state');
        if (stateEl) {
          if (position !== undefined) {
            stateEl.textContent = `${position}%`;
          } else {
            stateEl.textContent = state || 'unavailable';
          }
        }
        
        const iconEl = item.querySelector('.cover-icon-wrap ha-icon');
        if (iconEl) iconEl.setAttribute('icon', this._getCoverIcon(state, position));
        
        const fillEl = item.querySelector('.cover-position-fill');
        if (fillEl && position !== undefined) {
          fillEl.style.width = `${position}%`;
        }
      } else {
        const isOn = ['on','home','playing','open','unlocked'].includes(entity.state);
        item.classList.toggle('is-on', isOn);
        
        const stateEl = item.querySelector('.state');
        if (stateEl) stateEl.textContent = entity.state || 'unavailable';
      }
    });
    
    const countEl = this.shadowRoot?.querySelector('.count');
    if (countEl) countEl.textContent = `${this._favorites.length} items`;
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

  // ============================================
  // RENDER
  // ============================================
  _render() {
    const cols = this._config.columns || 2;
    const allowReorder = this._config.allow_reorder !== false;
    const customStyle = this._config.card_mod?.style || '';
    
    this.shadowRoot.innerHTML = `
      <style>
        /* ========== THEME VARIABLES ========== */
        :host {
          ${this._getThemeStyles()}
          display: block;
          box-sizing: border-box;
        }
        
        *, *:before, *:after { box-sizing: inherit; }
        
        /* ========== CARD CONTAINER ========== */
        .card {
          background: var(--fgc-card-bg);
          border: 1px solid var(--fgc-card-border);
          border-radius: var(--fgc-card-radius);
          padding: 16px;
          backdrop-filter: var(--fgc-card-blur);
          -webkit-backdrop-filter: var(--fgc-card-blur);
          box-shadow: var(--fgc-card-shadow);
        }
        
        /* ========== HEADER ========== */
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          padding: 0 4px;
        }
        .title { 
          font-size: 14px; 
          font-weight: 600; 
          color: var(--fgc-text-primary); 
        }
        .count { 
          font-size: 12px; 
          color: var(--fgc-text-secondary); 
          background: var(--fgc-icon-bg); 
          padding: 4px 10px; 
          border-radius: 12px; 
        }
        
        /* ========== GRID ========== */
        .grid {
          display: grid;
          grid-template-columns: repeat(${cols}, minmax(0, 1fr));
          grid-auto-rows: minmax(28px, auto);
          gap: 10px;
          align-items: start;
        }
        
        @keyframes itemRemove { to { opacity: 0; transform: scale(0.8); } }
        @keyframes itemAdd { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
        
        /* ========== BASE ITEM ========== */
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
        
        /* Drag states */
        .item.dragging {
          opacity: 0.5;
          cursor: grabbing;
          transform: scale(1.02);
        }
        .item.drag-over {
          border-color: var(--fgc-accent-primary);
          box-shadow: 0 0 0 2px rgba(0, 137, 123, 0.3);
        }
        
        /* ========== LIGHT ITEM (2 rows) ========== */
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
        .light-item.is-on .icon-wrap ha-icon { color: #fff; }
        .light-item.is-on .state { color: var(--fgc-accent-secondary); }
        
        .light-item .item-info { display: flex; flex-direction: column; gap: 1px; flex: 1; min-width: 0; }
        .light-item .name { font-size: 13px; font-weight: 500; color: var(--fgc-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .light-item .state { font-size: 11px; color: var(--fgc-text-secondary); }
        
        /* ========== COVER ITEM (4 rows) ========== */
        .cover-item {
          grid-row: span 4;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          cursor: ${allowReorder ? 'grab' : 'default'};
          height: 100%;
          align-self: start;
        }
        
        .cover-header {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .cover-icon-wrap {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          background: var(--fgc-icon-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s;
        }
        .cover-icon-wrap ha-icon {
          color: var(--fgc-icon-color);
          --mdc-icon-size: 20px;
        }
        
        .cover-item.is-open .cover-icon-wrap {
          background: linear-gradient(135deg, #5c6bc0, #7986cb);
          box-shadow: 0 4px 16px rgba(92, 107, 192, 0.5);
        }
        .cover-item.is-open .cover-icon-wrap ha-icon { color: white; }
        
        .cover-item.is-moving .cover-icon-wrap {
          background: linear-gradient(135deg, #ff9800, #ffb74d);
          box-shadow: 0 4px 16px rgba(255, 152, 0, 0.5);
          animation: pulse 1s infinite;
        }
        .cover-item.is-moving .cover-icon-wrap ha-icon { color: white; }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        .cover-item.is-open {
          background: var(--fgc-cover-open-bg);
          border-color: var(--fgc-cover-open-border);
          box-shadow: 0 4px 20px rgba(92, 107, 192, 0.15), inset 0 1px 0 rgba(255,255,255,0.08);
        }
        
        .cover-item.is-moving {
          background: linear-gradient(135deg, rgba(255, 152, 0, 0.2), rgba(255, 183, 77, 0.15));
          border-color: rgba(255, 152, 0, 0.4);
        }
        
        .cover-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .cover-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--fgc-text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .cover-state {
          font-size: 11px;
          color: var(--fgc-text-secondary);
          text-transform: capitalize;
        }
        .cover-item.is-open .cover-state { color: rgba(121, 134, 203, 1); }
        .cover-item.is-moving .cover-state { color: rgba(255, 183, 77, 1); }
        
        /* Cover Controls */
        .cover-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 4px 0 0 0;
          margin-top: auto;
          width: 100%;
        }
        
        .cover-btn {
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 14px;
          background: var(--fgc-button-bg);
          color: var(--fgc-icon-color);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .cover-btn ha-icon {
          --mdc-icon-size: 18px;
        }
        .cover-btn:hover { 
          background: var(--fgc-button-hover-bg); 
          color: var(--fgc-text-primary);
          transform: scale(1.08);
        }
        .cover-btn:active { transform: scale(0.95); }
        
        .cover-btn.up:hover { background: rgba(92, 107, 192, 0.4); }
        .cover-btn.down:hover { background: rgba(92, 107, 192, 0.4); }
        .cover-btn.stop:hover { background: rgba(244, 67, 54, 0.4); }
        
        /* Cover Position Bar */
        .cover-position {
          padding: 0 4px;
        }
        .cover-position-track {
          height: 4px;
          background: var(--fgc-icon-bg);
          border-radius: 2px;
          overflow: hidden;
        }
        .cover-position-fill {
          height: 100%;
          background: linear-gradient(90deg, #5c6bc0, #7986cb);
          border-radius: 2px;
          transition: width 0.3s ease;
        }
        .cover-item.is-moving .cover-position-fill {
          background: linear-gradient(90deg, #ff9800, #ffb74d);
        }
        
        /* ========== STANDARD ITEM (2 rows) ========== */
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
        
        /* ========== CLIMATE ITEM (4 rows) ========== */
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
          align-items: flex-start;
          justify-content: space-between;
        }
        
        .climate-left {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 0;
        }
        
        .climate-icon-wrap {
          position: relative;
          z-index: 100;
        }
        
        .climate-icon-btn {
          width: 36px;
          height: 36px;
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
          box-shadow: 0 4px 20px rgba(0, 180, 220, 0.15), inset 0 1px 0 rgba(255,255,255,0.08);
        }
        
        .climate-item.is-heating .climate-icon-btn {
          background: linear-gradient(135deg, #ff9800, #ffb74d);
          box-shadow: 0 4px 16px rgba(255, 160, 60, 0.5);
        }
        .climate-item.is-heating {
          background: var(--fgc-climate-heat-bg);
          border-color: var(--fgc-climate-heat-border);
          box-shadow: 0 4px 20px rgba(255, 140, 40, 0.15), inset 0 1px 0 rgba(255,255,255,0.08);
        }
        
        .climate-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .climate-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--fgc-text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .climate-mode {
          font-size: 11px;
          color: var(--fgc-text-secondary);
          text-transform: capitalize;
        }
        .climate-item.is-on .climate-mode { color: rgba(0, 240, 210, 1); }
        .climate-item.is-heating .climate-mode { color: rgba(255, 200, 120, 1); }
        
        /* ========== HVAC DROPDOWN ========== */
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
        
        /* ========== FAN MODE BUTTON ========== */
        .fan-mode-wrap {
          position: absolute;
          top: 8px;
          right: 8px;
          z-index: 100;
        }
        .fan-mode-wrap.disabled {
          opacity: 0.35;
          pointer-events: none;
        }
        
        .fan-mode-btn {
          width: 32px;
          height: 32px;
          border-radius: 10px;
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
        
        /* Fan dropdown */
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
        
        /* ========== CLIMATE CONTROLS ========== */
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
        
        /* ========== LONG PRESS RENAME ========== */
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
        
        /* Rename Popup Overlay */
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
        
        /* ========== EMPTY STATE ========== */
        .empty { text-align: center; padding: 32px 16px; }
        .empty-icon { font-size: 48px; margin-bottom: 12px; opacity: 0.3; }
        .empty-text { color: var(--fgc-text-secondary); font-size: 13px; }
        
        /* ========== CUSTOM CARD-MOD STYLES ========== */
        ${customStyle}
      </style>
      
      <div class="card">
        ${this._config.title ? `
          <div class="header">
            <span class="title">${this._config.title}</span>
            <span class="count">${this._favorites.length} items</span>
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
          </div>
        </div>
      </div>
    `;
    
    this._attachEventListeners();
  }

  _renderItem(fav) {
    const domain = fav.entity_id.split('.')[0];
    const entity = this._hass?.states[fav.entity_id];
    
    if (domain === 'climate') {
      return this._renderClimateItem(fav, entity);
    } else if (domain === 'cover') {
      return this._renderCoverItem(fav, entity);
    } else if (domain === 'light' && this._config.light_compact) {
      return this._renderLightItem(fav, entity);
    } else {
      return this._renderStandardItem(fav, entity);
    }
  }

  _renderClimateItem(fav, entity) {
    const isOn = entity && entity.state !== 'off' && entity.state !== 'unavailable';
    const mode = entity?.state || 'off';
    const temp = entity?.attributes?.temperature;
    const modes = entity?.attributes?.hvac_modes || ['off', 'cool', 'heat', 'auto'];
    const fanModes = entity?.attributes?.fan_modes || [];
    const currentFanMode = entity?.attributes?.fan_mode || 'auto';
    const allowReorder = this._config.allow_reorder !== false;
    
    return `
      <div class="item climate-item ${isOn ? 'is-on' : 'is-off'} ${mode === 'cool' ? 'is-cooling' : ''} ${mode === 'heat' ? 'is-heating' : ''}" 
           data-entity="${fav.entity_id}"
           ${allowReorder ? `draggable="true"` : ''}>
        
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
              <div class="climate-mode">${mode}${isOn && fanModes.length > 0 ? ` · ${currentFanMode}` : ''}</div>
            </div>
          </div>
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
    const isOpen = state === 'open' || (position !== undefined && position > 0);
    const isClosed = state === 'closed' || position === 0;
    const isMoving = state === 'opening' || state === 'closing';
    const allowReorder = this._config.allow_reorder !== false;
    const showControls = this._config.show_cover_controls !== false;
    
    let positionText = state;
    if (position !== undefined) {
      positionText = `${position}%`;
    } else if (state === 'open') {
      positionText = 'Open';
    } else if (state === 'closed') {
      positionText = 'Closed';
    }
    
    return `
      <div class="item cover-item ${isOpen ? 'is-open' : ''} ${isClosed ? 'is-closed' : ''} ${isMoving ? 'is-moving' : ''}" 
           data-entity="${fav.entity_id}"
           ${allowReorder ? `draggable="true"` : ''}>
        
        <div class="cover-header">
          <div class="cover-icon-wrap">
            <ha-icon icon="${this._getCoverIcon(state, position)}"></ha-icon>
          </div>
          <div class="cover-info">
            <div class="cover-name">${this._getName(fav)}</div>
            <div class="cover-state">${positionText}</div>
          </div>
        </div>
        
        ${showControls ? `
          <div class="cover-controls">
            <button class="cover-btn up" data-entity="${fav.entity_id}" data-action="open">
              <ha-icon icon="mdi:arrow-up"></ha-icon>
            </button>
            <button class="cover-btn stop" data-entity="${fav.entity_id}" data-action="stop">
              <ha-icon icon="mdi:stop"></ha-icon>
            </button>
            <button class="cover-btn down" data-entity="${fav.entity_id}" data-action="close">
              <ha-icon icon="mdi:arrow-down"></ha-icon>
            </button>
          </div>
          ${position !== undefined ? `
            <div class="cover-position">
              <div class="cover-position-track">
                <div class="cover-position-fill" style="width: ${position}%"></div>
              </div>
            </div>
          ` : ''}
        ` : ''}
      </div>
    `;
  }

  _renderStandardItem(fav, entity) {
    const isOn = ['on','home','playing','open','unlocked','heat','cool'].includes(entity?.state);
    const allowReorder = this._config.allow_reorder !== false;
    
    return `
      <div class="item standard-item ${isOn ? 'is-on' : ''}" 
           data-entity="${fav.entity_id}"
           ${allowReorder ? `draggable="true"` : ''}>
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
    
    // Light items - toggle on click
    this.shadowRoot.querySelectorAll('.light-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if (!this._draggedItem) {
          this._toggleLight(el.dataset.entity, e);
        }
      });
    });
    
    // Standard items - toggle on click
    this.shadowRoot.querySelectorAll('.standard-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if (!this._draggedItem) {
          this._toggleEntity(el.dataset.entity);
        }
      });
    });
    
    // Climate icon buttons - toggle dropdown
    this.shadowRoot.querySelectorAll('.climate-icon-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this._toggleClimateDropdown(btn.dataset.entity, e);
      });
    });
    
    // HVAC options
    this.shadowRoot.querySelectorAll('.hvac-option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        this._setHvacMode(opt.dataset.entity, opt.dataset.mode, e);
      });
    });
    
    // Fan mode buttons - toggle dropdown
    this.shadowRoot.querySelectorAll('.fan-mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this._toggleFanDropdown(btn.dataset.entity, e);
      });
    });
    
    // Fan mode options
    this.shadowRoot.querySelectorAll('.fan-option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        this._setFanMode(opt.dataset.entity, opt.dataset.fanMode, e);
      });
    });
    
    // Temperature buttons
    this.shadowRoot.querySelectorAll('.temp-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this._climateSetTemp(btn.dataset.entity, parseInt(btn.dataset.delta), e);
      });
    });
    
    // Cover buttons
    this.shadowRoot.querySelectorAll('.cover-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this._coverControl(btn.dataset.entity, btn.dataset.action, e);
      });
    });
    
    // Drag and drop
    if (allowReorder) {
      this.shadowRoot.querySelectorAll('.item').forEach(el => {
        el.addEventListener('dragstart', (e) => this._handleDragStart(e, el.dataset.entity));
        el.addEventListener('dragend', (e) => this._handleDragEnd(e));
        el.addEventListener('dragover', (e) => this._handleDragOver(e, el.dataset.entity));
        el.addEventListener('drop', (e) => this._handleDrop(e, el.dataset.entity));
      });
    }
    
    // Long press to rename (for all items)
    this.shadowRoot.querySelectorAll('.item').forEach(el => {
      el.addEventListener('pointerdown', (e) => this._handlePointerDown(e, el));
      el.addEventListener('pointermove', (e) => this._handlePointerMove(e));
      el.addEventListener('pointerup', (e) => this._handlePointerUp(e));
      el.addEventListener('pointercancel', (e) => this._handlePointerUp(e));
      el.addEventListener('pointerleave', (e) => this._handlePointerUp(e));
    });
    
    // Rename popup buttons
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
