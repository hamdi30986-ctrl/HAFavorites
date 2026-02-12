/**
 * Favorites Admin Card — v4.3
 * A Lovelace card for admins to manage favorites across all users.
 *
 * Features:
 *   Tab 1 – Overview   : View all users, favorites count, activity log
 *   Tab 2 – Add        : Search entities (input) + Select (dropdown), bulk add, preset management
 *   Tab 3 – Remove     : Per-user entity removal (respects locks)
 *   Tab 4 – Reorder    : Drag-and-drop reorder for any user
 *   Tab 5 – Settings   : Entity lock, user lock, clone
 *
 * Theme system mirrors favorites-grid-card.js (--fgc-* CSS variables, exact values)
 */

/* ──────────────────── EDITOR ──────────────────── */
class FavoritesAdminCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) { this._hass = hass; }

  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; padding:16px; }
        .row { margin-bottom:14px; display:flex; flex-direction:column; }
        .row label { font-size:12px; font-weight:500; text-transform:uppercase;
          letter-spacing:.5px; opacity:.8; margin-bottom:6px;
          color:var(--primary-text-color); }
        .row input, .row select {
          padding:10px 12px;
          border:1px solid var(--divider-color, rgba(255,255,255,.12));
          border-radius:8px;
          background:var(--card-background-color, rgba(255,255,255,.05));
          color:var(--primary-text-color); font-size:14px; outline:none;
          transition:border-color .2s; }
        .row input:focus, .row select:focus {
          border-color:var(--primary-color, #03a9f4); }
        .themes { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }
        .th { padding:14px 12px; border:2px solid var(--divider-color, rgba(255,255,255,.12));
          border-radius:12px; cursor:pointer; text-align:center; transition:all .2s; }
        .th:hover { border-color:var(--primary-color); background:rgba(3,169,244,.05); }
        .th.sel { border-color:var(--primary-color); background:rgba(3,169,244,.1); }
      </style>
      <div class="row">
        <label>Title</label>
        <input type="text" id="title"
          value="${this._config.title || ''}"
          placeholder="Favorites Admin">
      </div>
      <div class="row">
        <label>Theme</label>
        <div class="themes">${['dark', 'light', 'liquid', 'native'].map(t =>
      `<div class="th${this._config.theme === t ? ' sel' : ''}"
                  data-theme="${t}">${t.charAt(0).toUpperCase() + t.slice(1)}</div>`
    ).join('')
      }</div>
      </div>
    `;
    this.shadowRoot.getElementById('title')
      .addEventListener('input', e => this._fire({ title: e.target.value }));
    this.shadowRoot.querySelectorAll('.th').forEach(el => {
      el.addEventListener('click', () => this._fire({ theme: el.dataset.theme }));
    });
  }

  _fire(changed) {
    this._config = { ...this._config, ...changed };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config } }));
    this._render();
  }
}
if (!customElements.get('favorites-admin-card-editor')) {
  customElements.define('favorites-admin-card-editor', FavoritesAdminCardEditor);
}

/* ──────────────────── CARD ──────────────────── */
class FavoritesAdminCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass = null;
    this._activeTab = 0;
    this._users = {};
    this._userNames = {};
    this._lockedEntities = {};
    this._lockedUsers = [];
    this._presets = {};
    this._activityLog = [];
    this._selectedUser = null;
    this._dragSrcIdx = null;
    this._initialized = false;
    this._selectedEntityId = null;
    this._addTargets = ['__all__']; // target user cache
    this._lastSensorHash = '';
    this._rendered = false;
    this._entityPickerSearch = '';
    this._entityPickerFilter = 'all';
  }

  static getConfigElement() { return document.createElement('favorites-admin-card-editor'); }
  static getStubConfig() { return { title: 'Favorites Admin', theme: 'dark' }; }

  setConfig(config) {
    this._config = {
      title: config.title || 'Favorites Admin',
      theme: config.theme || 'dark',
      ...config,
    };
    this._rendered = false;
    if (this._hass) this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._initialized) {
      this._initialized = true;
      this._loadUserNames();
    }
    const changed = this._syncFromSensor();
    // Optimisation: Only re-render if data changed or first load
    if (!this._rendered || changed) {
      this._render();
    }
  }

  getCardSize() { return 6; }

  /* ── data helpers ───────────────────────────── */

  async _loadUserNames() {
    try {
      const list = await this._hass.callWS({ type: 'config/auth/list' });
      const map = {};
      for (const u of list) map[u.id] = u.name || u.id;
      this._userNames = map;
      this._render();
    } catch (e) {
      console.warn('admin-card: could not load user names', e);
    }
  }

  _syncFromSensor() {
    const s = this._hass?.states?.['sensor.favorites_list'];
    if (!s) return false;
    // Hash check to prevent unnecessary re-renders
    const hash = JSON.stringify(s.attributes);
    if (hash === this._lastSensorHash) return false;
    this._lastSensorHash = hash;

    const a = s.attributes;
    this._users = a.users || {};
    this._lockedEntities = a.locked_entities || {};
    this._lockedUsers = a.locked_users || [];
    this._presets = a.presets || {};
    return true;
  }

  _userName(uid) { return this._userNames[uid] || uid; }

  _entityName(eid) {
    const s = this._hass?.states?.[eid];
    return s?.attributes?.friendly_name || eid;
  }

  _getDomainIcon(domain) {
    const icons = {
      light: 'mdi:lightbulb', switch: 'mdi:toggle-switch', climate: 'mdi:thermostat',
      cover: 'mdi:blinds', fan: 'mdi:fan', media_player: 'mdi:speaker',
      camera: 'mdi:cctv', lock: 'mdi:lock', vacuum: 'mdi:robot-vacuum',
      sensor: 'mdi:eye', binary_sensor: 'mdi:checkbox-marked-circle',
      automation: 'mdi:robot', script: 'mdi:script-text', scene: 'mdi:palette',
      input_boolean: 'mdi:toggle-switch-outline', input_number: 'mdi:ray-vertex',
      input_select: 'mdi:form-select', person: 'mdi:account',
      device_tracker: 'mdi:crosshairs-gps', weather: 'mdi:weather-partly-cloudy',
      water_heater: 'mdi:water-boiler', humidifier: 'mdi:air-humidifier',
    };
    return icons[domain] || 'mdi:puzzle';
  }

  /* ── theme — EXACT copy from favorites-grid-card.js ── */

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
            `,
    };
    return themes[theme] || themes.dark;
  }

  _call(service, data = {}) {
    this._hass.callService('favorites', service, data);
  }

  /* ── render ─────────────────────────────────── */

  _render() {
    if (!this._hass) return;
    this._rendered = true;

    // Admin gate
    if (!this._hass.user?.is_admin) {
      this.shadowRoot.innerHTML = `
        <ha-card>
          <div style="padding:32px;text-align:center;color:var(--error-color,#ff5252)">
            <ha-icon icon="mdi:shield-lock" style="width:48px;height:48px;display:block;margin:0 auto 12px"></ha-icon>
            <b>Admin access required</b>
          </div>
        </ha-card>`;
      return;
    }

    const tabs = ['Overview', 'Add', 'Remove', 'Reorder', 'Settings'];

    this.shadowRoot.innerHTML = `
      <style>${this._css()}</style>
      <div class="adm-card" style="${this._getThemeStyles()}">
        <div class="adm-header">
          <div class="adm-header-icon">
            <ha-icon icon="mdi:shield-crown"></ha-icon>
          </div>
          <span class="adm-header-title">${this._config.title}</span>
        </div>
        <div class="adm-tabs">
          ${tabs.map((l, i) => `<div class="adm-tab${this._activeTab === i ? ' active' : ''}" data-tab="${i}">${l}</div>`).join('')}
        </div>
        <div class="adm-body">
          ${this._renderTabContent()}
        </div>
      </div>
    `;

    this.shadowRoot.querySelectorAll('.adm-tab').forEach(el => {
      el.addEventListener('click', () => {
        this._activeTab = parseInt(el.dataset.tab);
        this._render();
      });
    });

    this._bindTab();
  }

  _css() {
    return `
      :host { display: block; }
      .adm-card {
        background: var(--fgc-card-bg);
        border: 1px solid var(--fgc-card-border);
        border-radius: var(--fgc-card-radius);
        box-shadow: var(--fgc-card-shadow);
        backdrop-filter: var(--fgc-card-blur);
        -webkit-backdrop-filter: var(--fgc-card-blur);
        overflow: hidden;
        color: var(--fgc-text-primary);
        font-family: 'Segoe UI', Roboto, sans-serif;
      }
      /* Header & Icon Fixes */
      .adm-header {
        display: flex; align-items: center; gap: 12px;
        padding: 20px 24px 14px;
      }
      .adm-header-icon {
        width: 36px; height: 36px;
        display: flex; align-items: center; justify-content: center;
        border-radius: 10px;
        background: var(--fgc-accent-gradient);
        flex-shrink: 0;
      }
      .adm-header-icon ha-icon {
        --mdc-icon-size: 20px; width: 20px; height: 20px; color: white;
      }
      .adm-header-title {
        font-size: 18px; font-weight: 700;
        letter-spacing: -0.3px;
        line-height: normal;
      }
      /* Tabs */
      .adm-tabs {
        display: flex; gap: 0;
        border-bottom: 1px solid var(--fgc-item-border);
        overflow-x: auto; padding: 0 16px;
      }
      .adm-tab {
        padding: 10px 16px; font-size: 13px; font-weight: 600;
        cursor: pointer; white-space: nowrap;
        color: var(--fgc-text-tertiary);
        border-bottom: 2px solid transparent;
        transition: color 0.15s ease, border-color 0.15s ease;
        user-select: none;
      }
      .adm-tab:hover { color: var(--fgc-text-primary); }
      .adm-tab.active {
        color: var(--fgc-accent-primary);
        border-bottom-color: var(--fgc-accent-primary);
      }
      .adm-body { padding: 18px 24px 24px; min-height: 200px; }
      
      /* Components */
      .adm-section { margin-bottom: 20px; }
      .adm-label {
        font-size: 11px; text-transform: uppercase; letter-spacing: 1px;
        color: var(--fgc-text-tertiary); margin-bottom: 10px; font-weight: 700;
      }
      .adm-pill {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 7px 14px; border-radius: 20px;
        background: var(--fgc-item-bg); border: 1px solid var(--fgc-item-border);
        font-size: 13px; cursor: pointer;
        transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        color: var(--fgc-text-secondary);
        user-select: none;
      }
      .adm-pill:hover { border-color: var(--fgc-accent-primary); color: var(--fgc-text-primary); }
      .adm-pill.sel {
        background: rgba(0, 137, 123, 0.15);
        border-color: var(--fgc-accent-primary);
        color: var(--fgc-accent-primary);
      }
      .adm-btn {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 8px 18px; border-radius: 10px; border: none;
        font-size: 13px; font-weight: 600; cursor: pointer;
        transition: background 0.15s ease;
        background: rgba(0, 137, 123, 0.15); color: var(--fgc-accent-primary);
        font-family: inherit;
      }
      .adm-btn:hover { background: rgba(0, 137, 123, 0.25); }
      .adm-btn.danger { background: rgba(255,82,82,.12); color: #ff5252; }
      .adm-btn.danger:hover { background: rgba(255,82,82,.22); }
      .adm-btn.success { background: rgba(76,175,80,.12); color: #4caf50; }
      .adm-btn.success:hover { background: rgba(76,175,80,.22); }
      .adm-input {
        width: 100%; padding: 10px 14px; border-radius: 10px;
        border: 1px solid var(--fgc-item-border); background: var(--fgc-item-bg);
        color: var(--fgc-text-primary); font-size: 14px; outline: none;
        box-sizing: border-box; transition: border-color 0.2s ease;
        font-family: inherit;
      }
      .adm-input:focus { border-color: var(--fgc-accent-primary); }
      .adm-input::placeholder { color: var(--fgc-text-tertiary); }
      select.adm-input { appearance: auto; cursor: pointer; }
      
      .adm-row {
        display: flex; align-items: center; gap: 10px;
        padding: 10px 14px; border-radius: 12px;
        background: var(--fgc-item-bg); border: 1px solid var(--fgc-item-border);
        margin-bottom: 6px; transition: background 0.15s ease, border-color 0.15s ease;
      }
      .adm-row:hover { border-color: var(--fgc-item-hover-border); background: var(--fgc-item-hover-bg); }
      .adm-row .name { flex: 1; font-size: 14px; font-weight: 500; }
      .adm-row .meta { font-size: 12px; color: var(--fgc-text-tertiary); }
      .adm-row .actions { display: flex; gap: 6px; }
      .adm-badge {
        display: inline-flex; align-items: center; gap: 4px;
        padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;
      }
      .adm-badge.info { background: rgba(0,137,123,.12); color: var(--fgc-accent-primary); }
      .adm-badge.warn { background: rgba(255,152,0,.12); color: #ff9800; }
      .adm-badge.err { background: rgba(255,82,82,.12); color: #ff5252; }
      .adm-empty {
        text-align: center; padding: 32px 0;
        color: var(--fgc-text-tertiary); font-size: 14px;
      }
      .adm-log-row {
        display: flex; gap: 12px; align-items: center;
        padding: 10px 14px; border-radius: 10px;
        background: var(--fgc-item-bg); margin-bottom: 4px;
        font-size: 13px; transition: background 0.15s ease;
      }
      .adm-log-row:hover { background: var(--fgc-item-hover-bg); }
      .adm-log-time { color: var(--fgc-text-tertiary); min-width: 130px; font-size: 11px; font-weight: 500; }
      .adm-log-entity { font-weight: 600; color: var(--fgc-accent-primary); }
      .adm-log-user { color: var(--fgc-text-secondary); font-size: 12px; }
      
      .adm-refresh-btn {
        display: inline-flex; align-items: center; justify-content: center;
        width: 32px; height: 32px; border-radius: 8px; border: none;
        background: var(--fgc-item-bg); color: var(--fgc-text-secondary);
        cursor: pointer; transition: background 0.15s ease, color 0.15s ease;
      }
      .adm-refresh-btn:hover { background: var(--fgc-item-hover-bg); color: var(--fgc-accent-primary); }
      .adm-refresh-btn ha-icon { --mdc-icon-size: 18px; width: 18px; height: 18px; }

      .adm-selected-entity {
        display: flex; align-items: center; gap: 10px;
        padding: 10px 14px; border-radius: 10px;
        background: rgba(0,137,123,.1); border: 1px solid var(--fgc-accent-primary);
        margin-bottom: 12px;
      }
      .adm-selected-entity ha-icon { --mdc-icon-size: 20px; width: 20px; height: 20px; color: var(--fgc-accent-primary); }
      .adm-selected-entity .sel-name { flex: 1; font-size: 14px; font-weight: 600; color: var(--fgc-accent-primary); }
      .adm-selected-entity .sel-id { font-size: 12px; color: var(--fgc-text-tertiary); }
      .adm-selected-entity .clear {
        width: 24px; height: 24px; border-radius: 6px; border: none;
        background: rgba(255,82,82,.15); color: #ff5252; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        font-size: 14px; font-weight: 700; transition: background 0.2s;
      }
      .adm-selected-entity .clear:hover { background: rgba(255,82,82,.25); }
      
      .adm-drag { cursor: grab; color: var(--fgc-text-tertiary); font-size: 16px; }
      .adm-drag:active { cursor: grabbing; }
      .adm-row.dragging { opacity: .35; }
      .adm-row.dragover { border-color: var(--fgc-accent-primary); background: rgba(0,137,123,.08); }
      .adm-chk { width: 16px; height: 16px; accent-color: var(--fgc-accent-primary); cursor: pointer; }
      
      /* Dropdown UI */
      .adm-entity-select-wrap { display: flex; gap: 8px; margin-bottom: 10px; }
      .adm-entity-select-wrap select {
        flex: 1; padding: 10px 14px; border-radius: 10px;
        border: 1px solid var(--fgc-item-border); background: var(--fgc-item-bg);
        color: var(--fgc-text-primary); font-size: 14px; outline: none;
        font-family: inherit; cursor: pointer; appearance: auto;
        transition: border-color 0.2s ease;
        /* prevent overflow */
        min-width: 0; 
        max-width: 100%;
      }
      .adm-entity-select-wrap select:focus { border-color: var(--fgc-accent-primary); }
      .adm-entity-select-wrap .filter-select { width: 110px; flex: none; }
      .adm-entity-select-wrap input {
        flex: 2; padding: 10px 14px; border-radius: 10px;
        border: 1px solid var(--fgc-item-border); background: var(--fgc-item-bg);
        color: var(--fgc-text-primary); font-size: 14px; outline: none;
        font-family: inherit; transition: border-color 0.2s ease;
      }
      .adm-entity-select-wrap input:focus { border-color: var(--fgc-accent-primary); }
    `;
  }

  /* ── tab content ─────────────────────────────── */

  _renderTabContent() {
    switch (this._activeTab) {
      case 0: return this._tabOverview();
      case 1: return this._tabAdd();
      case 2: return this._tabRemove();
      case 3: return this._tabReorder();
      case 4: return this._tabSettings();
      default: return '';
    }
  }

  /* ─── Tab 0: Overview ─────────────────────────── */
  _tabOverview() {
    const uids = Object.keys(this._users);
    let html = `<div class="adm-section">
      <div class="adm-label">Users (${uids.length})</div>`;
    if (!uids.length) {
      html += `<div class="adm-empty">No users with favorites yet.</div>`;
    } else {
      for (const uid of uids) {
        const items = this._users[uid] || [];
        const isLocked = this._lockedUsers.includes(uid);
        html += `<div class="adm-row">
          <div class="name">
            ${this._userName(uid)}
            ${isLocked ? '<span class="adm-badge warn">🔒 Locked</span>' : ''}
          </div>
          <span class="adm-badge info">${items.length} items</span>
        </div>`;
      }
    }
    html += `</div>`;

    html += `<div class="adm-section">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <div class="adm-label" style="margin-bottom:0;">Activity Log</div>
        <button class="adm-refresh-btn" id="btnRefreshLog" title="Refresh log">
          <ha-icon icon="mdi:refresh"></ha-icon>
        </button>
      </div>
      <div id="logContainer">
        ${this._renderLog()}
      </div>
    </div>`;
    return html;
  }

  _renderLog() {
    if (!this._activityLog.length)
      return '<div class="adm-empty">No activity yet. Click refresh to load.</div>';
    return this._activityLog.slice(0, 30).map(e => {
      const ts = e.removed_at ? new Date(e.removed_at).toLocaleString() : '—';
      return `<div class="adm-log-row">
        <span class="adm-log-time">${ts}</span>
        <span class="adm-log-entity">${this._entityName(e.entity_id)}</span>
        <span class="adm-log-user">by ${this._userName(e.user_id)}</span>
      </div>`;
    }).join('');
  }

  /* ─── Tab 1: Add ──────────────────────────────── */
  _tabAdd() {
    const uids = Object.keys(this._users);
    const allUserIds = Object.keys(this._userNames);
    const targetUids = allUserIds.length ? allUserIds : uids;

    let presetHtml = '';
    const presetNames = Object.keys(this._presets);
    if (presetNames.length) {
      presetHtml = `<div class="adm-section">
        <div class="adm-label">Saved Presets</div>
        ${presetNames.map(n => {
        const p = this._presets[n];
        return `<div class="adm-row">
            <div class="name">${n} <span class="meta">(${p.entity_ids.length} entities)</span></div>
            <div class="actions">
              <button class="adm-btn" data-preset-apply="${n}">Apply</button>
              <button class="adm-btn danger" data-preset-del="${n}">✕</button>
            </div>
          </div>`;
      }).join('')}
      </div>`;
    }

    const selectedHtml = this._selectedEntityId ? `
        <div class="adm-selected-entity">
          <ha-icon icon="${this._getDomainIcon(this._selectedEntityId.split('.')[0])}"></ha-icon>
          <div class="sel-name">${this._entityName(this._selectedEntityId)}</div>
          <span class="sel-id">${this._selectedEntityId}</span>
          <button class="clear" id="clearEntity">✕</button>
        </div>
      ` : '';

    return `
      <div class="adm-section">
        <div class="adm-label">Select Entity</div>
        ${selectedHtml}
        <div class="adm-entity-select-wrap">
          <input id="entitySearch" placeholder="Type to filter..." value="${this._entityPickerSearch}">
          <select class="filter-select" id="entityFilter">
            <option value="all">All</option>
            <option value="light">Lights</option>
            <option value="switch">Switches</option>
            <option value="climate">Climate</option>
            <option value="cover">Covers</option>
            <option value="fan">Fans</option>
            <option value="media_player">Media</option>
            <option value="sensor">Sensors</option>
            <option value="camera">Cameras</option>
            <option value="lock">Locks</option>
            <option value="scene">Scenes</option>
            <option value="script">Scripts</option>
            <option value="automation">Automations</option>
          </select>
        </div>
        <div class="adm-entity-select-wrap">
          <select id="entityDropdown">
            <option value="">— Choose an entity —</option>
            ${this._buildEntityOptions()}
          </select>
        </div>
        <input class="adm-input" id="addCustomName" placeholder="Custom display name (optional)" style="margin-bottom:12px;">
        <div class="adm-label" style="margin-top:4px;">Target Users</div>
        <div id="addTargets" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;">
          <div class="adm-pill${this._addTargets.includes('__all__') ? ' sel' : ''}" data-uid="__all__">All Users</div>
          ${targetUids.map(u => `<div class="adm-pill${this._addTargets.includes(u) ? ' sel' : ''}" data-uid="${u}">${this._userName(u)}</div>`).join('')}
        </div>
        <button class="adm-btn" id="btnAddDefault">
          <ha-icon icon="mdi:plus" style="--mdc-icon-size:16px;width:16px;height:16px"></ha-icon> Add to Favorites
        </button>
      </div>

      <div class="adm-section">
        <div class="adm-label">Save as Preset</div>
        <div style="display:flex;gap:8px;">
          <input class="adm-input" id="presetName" placeholder="Preset name" style="flex:1;">
          <button class="adm-btn" id="btnSavePreset">Save</button>
        </div>
      </div>

      ${presetHtml}
    `;
  }

  _buildEntityOptions() {
    if (!this._hass) return '';
    const filter = this._entityPickerFilter || 'all';
    const search = (this._entityPickerSearch || '').toLowerCase();

    const entities = Object.keys(this._hass.states)
      .filter(eid => {
        if (filter !== 'all' && !eid.startsWith(filter + '.')) return false;
        if (search) {
          const n = this._hass.states[eid]?.attributes?.friendly_name || eid;
          if (!n.toLowerCase().includes(search) && !eid.toLowerCase().includes(search)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const nameA = this._hass.states[a]?.attributes?.friendly_name || a;
        const nameB = this._hass.states[b]?.attributes?.friendly_name || b;
        return nameA.localeCompare(nameB);
      })
      // Limit to 200 items to prevent dropdown lag if too many matches
      .slice(0, 200);

    return entities.map(eid => {
      const name = this._hass.states[eid]?.attributes?.friendly_name || eid;
      const selected = eid === this._selectedEntityId ? ' selected' : '';
      return `<option value="${eid}"${selected}>${name} (${eid})</option>`;
    }).join('');
  }

  /* ─── Tab 2: Remove ────────────────────────── */
  _tabRemove() {
    const uids = Object.keys(this._users);
    if (!uids.length) return '<div class="adm-empty">No users with favorites.</div>';
    const sel = this._selectedUser || uids[0];
    const items = this._users[sel] || [];
    const lockedList = this._lockedEntities[sel] || [];
    return `
      <div class="adm-section">
        <div class="adm-label">Select User</div>
        <select class="adm-input" id="removeUserSelect">
          ${uids.map(u => `<option value="${u}" ${u === sel ? 'selected' : ''}>${this._userName(u)}</option>`).join('')}
        </select>
      </div>
      <div class="adm-section">
        <div class="adm-label">Favorites (${items.length})</div>
        ${items.length ? items.map(it => {
      const isLocked = lockedList.includes(it.entity_id);
      return `<div class="adm-row">
            ${!isLocked ? `<input type="checkbox" class="adm-chk" data-eid="${it.entity_id}">` : ''}
            <div class="name">
              ${this._entityName(it.entity_id)}
              ${isLocked ? '<span class="adm-badge warn">🔒</span>' : ''}
            </div>
            <span class="meta">${it.entity_id}</span>
          </div>`;
    }).join('') : '<div class="adm-empty">No favorites for this user.</div>'}
        ${items.length ? `<button class="adm-btn danger" id="btnRemoveSelected" style="margin-top:8px;">
          <ha-icon icon="mdi:delete" style="--mdc-icon-size:16px;width:16px;height:16px"></ha-icon> Remove Selected
        </button>` : ''}
      </div>
    `;
  }

  /* ─── Tab 3: Reorder ───────────────────────── */
  _tabReorder() {
    const uids = Object.keys(this._users);
    if (!uids.length) return '<div class="adm-empty">No users with favorites.</div>';
    const sel = this._selectedUser || uids[0];
    const items = this._users[sel] || [];
    return `
      <div class="adm-section">
        <div class="adm-label">Select User</div>
        <select class="adm-input" id="reorderUserSelect">
          ${uids.map(u => `<option value="${u}" ${u === sel ? 'selected' : ''}>${this._userName(u)}</option>`).join('')}
        </select>
      </div>
      <div class="adm-section">
        <div class="adm-label">Drag to Reorder (${items.length})</div>
        <div id="reorderList">
          ${items.map((it, i) => `
            <div class="adm-row" draggable="true" data-idx="${i}" data-eid="${it.entity_id}">
              <span class="adm-drag">☰</span>
              <div class="name">${this._entityName(it.entity_id)}</div>
              <span class="meta">${it.entity_id}</span>
            </div>
          `).join('')}
        </div>
        ${items.length > 1 ? `<button class="adm-btn success" id="btnSaveOrder" style="margin-top:10px;">
          <ha-icon icon="mdi:content-save" style="--mdc-icon-size:16px;width:16px;height:16px"></ha-icon> Save Order
        </button>` : ''}
      </div>
    `;
  }

  /* ─── Tab 4: Settings ──────────────────────── */
  _tabSettings() {
    const uids = Object.keys(this._users);
    const sel = this._selectedUser || (uids.length ? uids[0] : null);
    const items = sel ? (this._users[sel] || []) : [];
    const lockedList = sel ? (this._lockedEntities[sel] || []) : [];

    let userLockHtml = uids.map(u => {
      const isLocked = this._lockedUsers.includes(u);
      return `<div class="adm-row">
        <div class="name">${this._userName(u)}</div>
        <button class="adm-btn${isLocked ? ' danger' : ' success'}" data-lockuser="${u}" data-lockstate="${isLocked ? 'false' : 'true'}">
          ${isLocked ? '🔓 Unlock' : '🔒 Lock'}
        </button>
      </div>`;
    }).join('');

    let cloneHtml = '';
    if (uids.length >= 2) {
      cloneHtml = `
        <div class="adm-section">
          <div class="adm-label">Clone Favorites</div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <select class="adm-input" id="cloneSrc" style="flex:1;">
              ${uids.map(u => `<option value="${u}">${this._userName(u)}</option>`).join('')}
            </select>
            <span style="font-size:18px;color:var(--fgc-text-tertiary)">→</span>
            <select class="adm-input" id="cloneDst" style="flex:1;">
              ${uids.map(u => `<option value="${u}">${this._userName(u)}</option>`).join('')}
            </select>
            <button class="adm-btn" id="btnClone">Clone</button>
          </div>
        </div>`;
    }
    return `
      <div class="adm-section">
        <div class="adm-label">Entity Locks</div>
        ${sel ? `<select class="adm-input" id="lockUserSelect" style="margin-bottom:10px;">
          ${uids.map(u => `<option value="${u}" ${u === sel ? 'selected' : ''}>${this._userName(u)}</option>`).join('')}
        </select>` : ''}
        ${items.length ? items.map(it => {
      const isLocked = lockedList.includes(it.entity_id);
      return `<div class="adm-row">
            <div class="name">${this._entityName(it.entity_id)}</div>
            <button class="adm-btn${isLocked ? ' danger' : ''}" data-lockent="${it.entity_id}" data-lockstate="${isLocked ? 'false' : 'true'}">
              ${isLocked ? '🔓 Unlock' : '🔒 Lock'}
            </button>
          </div>`;
    }).join('') : '<div class="adm-empty">No entities</div>'}
      </div>
      <div class="adm-section">
        <div class="adm-label">User Lock Mode</div>
        ${userLockHtml || '<div class="adm-empty">No users</div>'}
      </div>
      ${cloneHtml}
    `;
  }

  _bindTab() {
    const root = this.shadowRoot;
    switch (this._activeTab) {
      case 0: { // Overview
        root.getElementById('btnRefreshLog')?.addEventListener('click', async () => {
          const unsub = this._hass.connection.subscribeEvents(e => {
            this._activityLog = e.data.activity_log || [];
            unsub.then(u => u());
            this._render();
          }, 'favorites_admin_data');
          this._call('admin_get_all');
        });
        break;
      }

      case 1: { // Add
        const updateDropdown = () => {
          const dd = root.getElementById('entityDropdown');
          if (dd) dd.innerHTML = `<option value="">— Choose an entity —</option>${this._buildEntityOptions()}`;
        };

        root.getElementById('entityDropdown')?.addEventListener('change', e => {
          const val = e.target.value;
          if (val) {
            this._selectedEntityId = val;
            // Clear search on selection to allow user to see full selection context
            this._entityPickerSearch = '';
            this._render();
          }
        });

        root.getElementById('entitySearch')?.addEventListener('input', e => {
          this._entityPickerSearch = e.target.value;
          updateDropdown();
        });

        root.getElementById('entityFilter')?.addEventListener('change', e => {
          this._entityPickerFilter = e.target.value;
          // Reset dropdown selection if filter changes? Maybe not.
          updateDropdown();
        });

        root.getElementById('clearEntity')?.addEventListener('click', () => {
          this._selectedEntityId = null;
          this._render();
        });

        root.querySelectorAll('#addTargets .adm-pill').forEach(p => {
          p.addEventListener('click', () => {
            const uid = p.dataset.uid;
            if (uid === '__all__') {
              this._addTargets = ['__all__'];
            } else {
              this._addTargets = this._addTargets.filter(t => t !== '__all__');
              if (this._addTargets.includes(uid)) {
                this._addTargets = this._addTargets.filter(t => t !== uid);
              } else {
                this._addTargets.push(uid);
              }
              if (this._addTargets.length === 0) {
                this._addTargets = ['__all__'];
              }
            }
            root.querySelectorAll('#addTargets .adm-pill').forEach(pp => {
              pp.classList.toggle('sel', this._addTargets.includes(pp.dataset.uid));
            });
          });
        });

        root.getElementById('btnAddDefault')?.addEventListener('click', () => {
          const eid = this._selectedEntityId;
          if (!eid) return;
          const customName = root.getElementById('addCustomName')?.value?.trim() || undefined;
          let targets = null;
          if (!this._addTargets.includes('__all__')) {
            targets = [...this._addTargets];
          }
          const data = { entity_id: eid };
          if (targets) data.target_user_ids = targets;
          if (customName) data.custom_name = customName;
          this._call('admin_add_default', data);
          this._selectedEntityId = null;
          this._render();
        });

        root.getElementById('btnSavePreset')?.addEventListener('click', () => {
          const name = root.getElementById('presetName')?.value?.trim();
          if (!name || !this._selectedEntityId) return;
          this._call('admin_save_preset', { name, entity_ids: [this._selectedEntityId] });
          root.getElementById('presetName').value = '';
        });

        root.querySelectorAll('[data-preset-apply]').forEach(btn => {
          btn.addEventListener('click', () => {
            this._call('admin_apply_preset', { name: btn.dataset.presetApply });
          });
        });
        root.querySelectorAll('[data-preset-del]').forEach(btn => {
          btn.addEventListener('click', () => {
            this._call('admin_delete_preset', { name: btn.dataset.presetDel });
          });
        });
        break;
      }

      case 2: { // Remove
        root.getElementById('removeUserSelect')?.addEventListener('change', e => {
          this._selectedUser = e.target.value;
          this._render();
        });
        root.getElementById('btnRemoveSelected')?.addEventListener('click', () => {
          const uid = root.getElementById('removeUserSelect')?.value;
          const checks = root.querySelectorAll('.adm-chk:checked');
          if (!uid || !checks.length) return;
          const eids = Array.from(checks).map(c => c.dataset.eid);
          for (const eid of eids) {
            this._call('admin_remove_entity', { entity_id: eid, target_user_ids: [uid] });
          }
        });
        break;
      }

      case 3: { // Reorder
        root.getElementById('reorderUserSelect')?.addEventListener('change', e => {
          this._selectedUser = e.target.value;
          this._render();
        });
        const list = root.getElementById('reorderList');
        if (list) {
          const rows = list.querySelectorAll('.adm-row');
          rows.forEach(row => {
            row.addEventListener('dragstart', () => {
              this._dragSrcIdx = parseInt(row.dataset.idx);
              row.classList.add('dragging');
            });
            row.addEventListener('dragend', () => {
              row.classList.remove('dragging');
              rows.forEach(r => r.classList.remove('dragover'));
            });
            row.addEventListener('dragover', e => {
              e.preventDefault();
              row.classList.add('dragover');
            });
            row.addEventListener('drop', e => {
              e.preventDefault();
              row.classList.remove('dragover');
              const targetIdx = parseInt(row.dataset.idx);
              if (this._dragSrcIdx === null || this._dragSrcIdx === targetIdx) return;
              const uid = root.getElementById('reorderUserSelect')?.value;
              const items = [...(this._users[uid] || [])];
              const [moved] = items.splice(this._dragSrcIdx, 1);
              items.splice(targetIdx, 0, moved);
              this._users = { ...this._users, [uid]: items };
              this._dragSrcIdx = null;
              this._render();
            });
          });
        }
        root.getElementById('btnSaveOrder')?.addEventListener('click', () => {
          const uid = root.getElementById('reorderUserSelect')?.value;
          if (!uid) return;
          const orderedEids = Array.from(
            root.querySelectorAll('#reorderList .adm-row')
          ).map(r => r.dataset.eid);
          this._call('admin_reorder', { user_id: uid, entity_ids: orderedEids });
        });
        break;
      }

      case 4: { // Settings
        root.getElementById('lockUserSelect')?.addEventListener('change', e => {
          this._selectedUser = e.target.value;
          this._render();
        });
        root.querySelectorAll('[data-lockent]').forEach(btn => {
          btn.addEventListener('click', () => {
            const uid = root.getElementById('lockUserSelect')?.value || this._selectedUser;
            this._call('admin_set_entity_lock', {
              user_id: uid,
              entity_id: btn.dataset.lockent,
              locked: btn.dataset.lockstate === 'true',
            });
          });
        });
        root.querySelectorAll('[data-lockuser]').forEach(btn => {
          btn.addEventListener('click', () => {
            this._call('admin_set_user_lock', {
              user_id: btn.dataset.lockuser,
              locked: btn.dataset.lockstate === 'true',
            });
          });
        });
        root.getElementById('btnClone')?.addEventListener('click', () => {
          const src = root.getElementById('cloneSrc')?.value;
          const dst = root.getElementById('cloneDst')?.value;
          if (!src || !dst || src === dst) return;
          if (confirm(`Clone all favorites from ${this._userName(src)} → ${this._userName(dst)}? This will REPLACE the target's favorites.`)) {
            this._call('admin_clone', { source_user_id: src, target_user_id: dst });
          }
        });
        break;
      }
    }
  }
}
if (!customElements.get('favorites-admin-card')) {
  customElements.define('favorites-admin-card', FavoritesAdminCard);
}
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'favorites-admin-card',
  name: 'Favorites Admin Card',
  description: 'Admin-only card to manage favorites across all users.',
  preview: false,
});
