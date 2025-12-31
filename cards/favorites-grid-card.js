/**
 * Favorites Grid Card for Home Assistant
 * v2.8.0 - Removed X button, fixed fan mode button position (top-right)
 * 
 * Features: user_id filtering, light/climate/cover styling, fan mode dropdown
 */
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
    this._userId = null;  // ADDED: store user_id
  }

  // ============================================
  // SYNC LOGIC - UNCHANGED (except user_id filter)
  // ============================================
  connectedCallback() {
    this._lastSensorIds = '';
    
    if (this._hass) {
      this._syncFromSensor();
    }
    
    this._handleUpdate = (e) => {
      const { entity_id, isFavorite, user_id } = e.detail;
      
      // ADDED: Only process if for current user or no user_id (backward compat)
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
    this._userId = hass.user?.id || null;  // ADDED: store user_id
    
    const sensor = hass.states['sensor.favorites_list'];
    // CHANGED: read from users[userId] instead of entity_ids
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
    // CHANGED: read from users[userId] instead of items/entity_ids
    const users = sensor?.attributes?.users || {};
    const userItems = this._userId ? (users[this._userId] || []) : [];
    this._favorites = userItems;
    this._entityIds = new Set(userItems.map(item => item.entity_id));
    this._smartRender();
  }

  _smartRender() {
    const newKey = this._favorites.map(f => f.entity_id).join(',');
    
    if (newKey === this._renderedKey && !this._isFirstRender) {
      this._updateStates();
      return;
    }
    
    this._renderedKey = newKey;
    this._isFirstRender = false;
    this._render();
  }
  // ============================================
  // END SYNC LOGIC
  // ============================================

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
        
        // Update fan mode button
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
      // Close any open dropdowns
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
      this._closeFanDropdown();  // Also close fan dropdown
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
    
    // Remove all drag-over states
    this.shadowRoot.querySelectorAll('.drag-over').forEach(el => {
      el.classList.remove('drag-over');
    });
  }

  _handleDragOver(e, entityId) {
    e.preventDefault();
    if (this._draggedItem === entityId) return;
    
    const item = this.shadowRoot.querySelector(`[data-entity="${entityId}"]`);
    if (item && !item.classList.contains('dragging')) {
      // Remove other drag-over states
      this.shadowRoot.querySelectorAll('.drag-over').forEach(el => {
        el.classList.remove('drag-over');
      });
      item.classList.add('drag-over');
    }
  }

  _handleDrop(e, targetEntityId) {
    e.preventDefault();
    
    if (!this._draggedItem || this._draggedItem === targetEntityId) return;
    
    // Reorder favorites
    const draggedIndex = this._favorites.findIndex(f => f.entity_id === this._draggedItem);
    const targetIndex = this._favorites.findIndex(f => f.entity_id === targetEntityId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    // Remove dragged item and insert at target position
    const [draggedFav] = this._favorites.splice(draggedIndex, 1);
    this._favorites.splice(targetIndex, 0, draggedFav);
    
    // Update rendered key and re-render
    this._renderedKey = '';
    this._smartRender();
    
    // Call reorder service - CHANGED: added user_id
    const newOrder = this._favorites.map(f => f.entity_id);
    this._hass.callService('favorites', 'reorder', { 
      entity_ids: newOrder,
      user_id: this._userId  // ADDED
    });
  }

  // ============================================
  // COMMON METHODS - UNCHANGED
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
    
    // CHANGED: added user_id
    await this._hass.callService('favorites', 'remove', { 
      entity_id: entityId,
      user_id: this._userId  // ADDED
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
    
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        
        .card {
          background: rgba(25, 25, 28, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 24px;
          padding: 16px;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05);
        }
        
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          padding: 0 4px;
        }
        .title { font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.92); }
        .count { font-size: 12px; color: rgba(255,255,255,0.5); background: rgba(255,255,255,0.08); padding: 4px 10px; border-radius: 12px; }
        
        /* Grid with fixed row heights */
        .grid {
          display: grid;
          grid-template-columns: repeat(${cols}, 1fr);
          grid-auto-rows: minmax(28px, auto);
          gap: 10px;
          align-items: start;
        }
        
        @keyframes itemRemove { to { opacity: 0; transform: scale(0.8); } }
        @keyframes itemAdd { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
        
        /* ========== BASE ITEM ========== */
        .item {
          position: relative;
          background: rgba(40, 40, 45, 0.6);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          transition: transform 0.2s, background 0.2s, border-color 0.2s, box-shadow 0.2s;
          animation: itemAdd 0.3s ease-out;
          ${allowReorder ? 'cursor: grab;' : ''}
        }
        .item:hover { 
          background: rgba(50,50,55,0.7); 
          border-color: rgba(255,255,255,0.12); 
        }
        .item.removing { animation: itemRemove 0.2s ease-out forwards; }
        
        /* Drag states */
        .item.dragging {
          opacity: 0.5;
          cursor: grabbing;
          transform: scale(1.02);
        }
        .item.drag-over {
          border-color: rgba(0, 200, 180, 0.6);
          box-shadow: 0 0 0 2px rgba(0, 200, 180, 0.3);
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
          background: rgba(255,255,255,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .light-item .icon-wrap ha-icon { 
          color: rgba(255,255,255,0.8); 
          --mdc-icon-size: 18px; 
        }
        
        .light-item.is-on {
          background: linear-gradient(135deg, rgba(255, 180, 80, 0.35), rgba(255, 220, 120, 0.2));
          border-color: rgba(255, 190, 90, 0.5);
          box-shadow: 0 4px 20px rgba(255, 160, 60, 0.25), inset 0 1px 0 rgba(255,255,255,0.1);
        }
        .light-item.is-on .icon-wrap {
          background: linear-gradient(135deg, #ffb347, #ffcc70);
          box-shadow: 0 2px 12px rgba(255, 170, 60, 0.6);
        }
        .light-item.is-on .icon-wrap ha-icon { color: #fff; }
        .light-item.is-on .state { color: rgba(255, 210, 130, 1); }
        
        .light-item .item-info { display: flex; flex-direction: column; gap: 1px; flex: 1; min-width: 0; }
        .light-item .name { font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.9); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .light-item .state { font-size: 11px; color: rgba(255,255,255,0.5); }
        
        /* ========== COVER ITEM (3 rows) ========== */
        .cover-item {
          grid-row: span 3;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          cursor: ${allowReorder ? 'grab' : 'default'};
          height: fit-content;
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
          background: rgba(255,255,255,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s;
        }
        .cover-icon-wrap ha-icon {
          color: rgba(255,255,255,0.7);
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
          background: linear-gradient(135deg, rgba(92, 107, 192, 0.25), rgba(121, 134, 203, 0.15));
          border-color: rgba(92, 107, 192, 0.4);
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
          color: rgba(255,255,255,0.9);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .cover-state {
          font-size: 11px;
          color: rgba(255,255,255,0.5);
          text-transform: capitalize;
        }
        .cover-item.is-open .cover-state { color: rgba(121, 134, 203, 1); }
        .cover-item.is-moving .cover-state { color: rgba(255, 183, 77, 1); }
        
        /* Cover Controls */
        .cover-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 4px 0;
        }
        
        .cover-btn {
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 10px;
          background: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.7);
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
          background: rgba(255,255,255,0.2); 
          color: white;
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
          background: rgba(255,255,255,0.12);
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
          background: linear-gradient(135deg, rgba(0,137,123,0.3), rgba(0,172,193,0.3));
          border-color: rgba(0,172,193,0.4);
        }
        
        .item-top { display: flex; align-items: center; gap: 10px; }
        .standard-item .icon-wrap {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .standard-item.is-on .icon-wrap {
          background: linear-gradient(135deg, #00897b, #00acc1);
          box-shadow: 0 2px 8px rgba(0,172,193,0.4);
        }
        .standard-item .icon-wrap ha-icon { color: rgba(255,255,255,0.8); --mdc-icon-size: 20px; }
        .standard-item.is-on .icon-wrap ha-icon { color: white; }
        
        .item-info { flex: 1; min-width: 0; }
        .name { font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.9); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .state { font-size: 11px; color: rgba(255,255,255,0.5); text-transform: capitalize; }
        .standard-item.is-on .state { color: rgba(0,230,200,0.9); }
        
        /* ========== CLIMATE ITEM (4 rows) ========== */
        .climate-item {
          grid-row: span 4;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          cursor: ${allowReorder ? 'grab' : 'default'};
          height: fit-content;
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
        
        /* Climate icon button with dropdown container */
        .climate-icon-wrap {
          position: relative;
          z-index: 100;
        }
        
        .climate-icon-btn {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          border: none;
          background: rgba(255,255,255,0.1);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .climate-icon-btn:hover {
          background: rgba(255,255,255,0.15);
          transform: scale(1.05);
        }
        .climate-icon-btn ha-icon {
          color: rgba(255,255,255,0.7);
          --mdc-icon-size: 20px;
        }
        
        /* Climate ON state - BRIGHTER */
        .climate-item.is-on .climate-icon-btn {
          background: linear-gradient(135deg, #00bfa5, #00e5cc);
          box-shadow: 0 4px 16px rgba(0, 230, 200, 0.5);
        }
        .climate-item.is-on .climate-icon-btn ha-icon { color: white; }
        
        .climate-item.is-cooling {
          background: linear-gradient(135deg, rgba(40, 45, 50, 0.7), rgba(0, 180, 220, 0.25));
          border-color: rgba(0, 200, 240, 0.4);
          box-shadow: 0 4px 20px rgba(0, 180, 220, 0.15), inset 0 1px 0 rgba(255,255,255,0.08);
        }
        
        .climate-item.is-heating .climate-icon-btn {
          background: linear-gradient(135deg, #ff9800, #ffb74d);
          box-shadow: 0 4px 16px rgba(255, 160, 60, 0.5);
        }
        .climate-item.is-heating {
          background: linear-gradient(135deg, rgba(45, 40, 35, 0.7), rgba(255, 160, 60, 0.2));
          border-color: rgba(255, 170, 70, 0.4);
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
          color: rgba(255,255,255,0.9);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .climate-mode {
          font-size: 11px;
          color: rgba(255,255,255,0.5);
          text-transform: capitalize;
        }
        .climate-item.is-on .climate-mode { color: rgba(0, 240, 210, 1); }
        .climate-item.is-heating .climate-mode { color: rgba(255, 200, 120, 1); }
        
        /* ========== HVAC DROPDOWN - HIGH Z-INDEX ========== */
        .hvac-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          background: rgba(25, 25, 30, 0.98);
          border: 1px solid rgba(255,255,255,0.15);
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
          color: rgba(255,255,255,0.85);
        }
        .hvac-option:hover { background: rgba(255,255,255,0.1); }
        .hvac-option.active { 
          background: rgba(0, 200, 180, 0.3); 
          color: #00ffd5;
        }
        .hvac-option ha-icon {
          --mdc-icon-size: 16px;
          color: rgba(255,255,255,0.6);
        }
        .hvac-option.active ha-icon { color: #00ffd5; }
        
        /* ========== FAN MODE BUTTON (top right) ========== */
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
          background: rgba(255,255,255,0.1);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .fan-mode-btn:hover {
          background: rgba(255,255,255,0.2);
          transform: scale(1.08);
        }
        .fan-mode-btn:active { transform: scale(0.95); }
        .fan-mode-btn ha-icon {
          color: rgba(255,255,255,0.6);
          --mdc-icon-size: 18px;
        }
        
        /* Fan button active when climate is on */
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
          background: rgba(25, 25, 30, 0.98);
          border: 1px solid rgba(255,255,255,0.15);
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
          color: rgba(255,255,255,0.85);
        }
        .fan-option:hover { background: rgba(255,255,255,0.1); }
        .fan-option.active { 
          background: rgba(0, 200, 180, 0.3); 
          color: #00ffd5;
        }
        .fan-option ha-icon {
          --mdc-icon-size: 16px;
          color: rgba(255,255,255,0.6);
        }
        .fan-option.active ha-icon { color: #00ffd5; }
        
        /* ========== CLIMATE CONTROLS ========== */
        .climate-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(0,0,0,0.3);
          border-radius: 12px;
          padding: 8px 10px;
          gap: 8px;
          position: relative;
          z-index: 1;
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
          background: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.7);
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .temp-btn:hover { 
          background: rgba(255,255,255,0.2); 
          color: white;
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
          background: rgba(255,255,255,0.12);
          border-radius: 2px;
        }
        
        .climate-temp {
          font-size: 18px;
          font-weight: 700;
          color: rgba(255,255,255,0.85);
          position: relative;
          z-index: 2;
          text-shadow: 0 2px 8px rgba(0,0,0,0.4);
        }
        .climate-item.is-on .climate-temp { color: white; }
        .climate-controls.disabled .climate-temp { color: rgba(255,255,255,0.35); }
        
        /* ========== EMPTY STATE ========== */
        .empty { text-align: center; padding: 32px 16px; }
        .empty-icon { font-size: 48px; margin-bottom: 12px; opacity: 0.3; }
        .empty-text { color: rgba(255,255,255,0.5); font-size: 13px; }
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
    
    // Determine position display
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

  _getCoverIcon(state, position) {
    if (state === 'opening') return 'mdi:arrow-up-box';
    if (state === 'closing') return 'mdi:arrow-down-box';
    if (state === 'closed' || position === 0) return 'mdi:blinds';
    if (position !== undefined && position < 100) return 'mdi:blinds-open';
    return 'mdi:blinds-open';
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
  window.customCards.push({ type: 'favorites-grid-card', name: 'Favorites Grid Card', description: 'Displays favorites with climate controls, light styling, and drag-drop reorder' });
}
console.info('%c FAVORITES-GRID-CARD %c v2.8.0 ', 'background: #00897b; color: white; font-weight: bold;', 'background: #00acc1; color: white;');