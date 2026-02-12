/**
 * Favoritable Card for Home Assistant
 * v2.2.1 - Added user_id support (minimal change from v2.2.0)
 */
class FavoritableCard extends HTMLElement {
  constructor() {
    super();
    this._config = {};
    this._hass = null;
    this._isFavorite = false;
    this._cardElement = null;
    this._starButton = null;
  }

  setConfig(config) {
    if (!config.entity && !config.card?.entity) {
      throw new Error('Please define an entity');
    }
    
    this._config = {
      entity: config.entity || config.card?.entity,
      button_position: config.button_position || 'top-right',
      button_size: config.button_size || '24px',
      show_icon: config.show_icon !== false,
      ...config,
    };
    
    this._createCard();
  }

  set hass(hass) {
    this._hass = hass;
    
    if (this._cardElement) {
      this._cardElement.hass = hass;
    }
    
    const sensor = hass.states['sensor.favorites_list'];
    const userId = hass.user?.id;
    const users = sensor?.attributes?.users || {};
    const userItems = userId ? (users[userId] || []) : [];
    const entityIds = userItems.map(item => item.entity_id);
    this._isFavorite = entityIds.includes(this._config.entity);
    this._updateStarButton();
  }

  async _toggleFavorite(e) {
    e.stopPropagation();
    e.preventDefault();
    
    if (!this._hass) return;
    
    this._starButton?.classList.add('animating');
    setTimeout(() => this._starButton?.classList.remove('animating'), 300);
    
    const willBeFavorite = !this._isFavorite;
    const entityId = this._config.entity;
    const userId = this._hass.user?.id;
    
    console.log('[favoritable-card] Toggling:', entityId, 'Will be favorite:', willBeFavorite);
    
    const event = new CustomEvent('favorites-updated', {
      detail: { 
        entity_id: entityId, 
        isFavorite: willBeFavorite,
        user_id: userId
      }
    });
    window.dispatchEvent(event);
    console.log('[favoritable-card] Event dispatched to window');
    
    this._isFavorite = willBeFavorite;
    this._updateStarButton();
    
    try {
      await this._hass.callService('favorites', 'toggle', {
        entity_id: entityId,
        user_id: userId,
      });
      console.log('[favoritable-card] Service call completed');
    } catch (error) {
      console.error('[favoritable-card] Service error:', error);
      this._isFavorite = !willBeFavorite;
      this._updateStarButton();
    }
  }

  _updateStarButton() {
    if (!this._starButton) return;
    
    this._starButton.innerHTML = this._isFavorite 
      ? '<ha-icon icon="mdi:star"></ha-icon>'
      : '<ha-icon icon="mdi:star-outline"></ha-icon>';
    
    this._starButton.style.color = this._isFavorite 
      ? '#FFD700' 
      : 'rgba(255, 255, 255, 0.5)';
  }

  _createCard() {
    this.innerHTML = '';
    
    this.style.cssText = 'display: block; position: relative;';
    
    this._starButton = document.createElement('button');
    this._starButton.className = 'favoritable-star';
    
    const pos = this._config.button_position;
    const size = this._config.button_size;
    
    let positionStyles = '';
    if (pos === 'top-right') positionStyles = 'top: 8px; right: 8px;';
    else if (pos === 'top-left') positionStyles = 'top: 8px; left: 8px;';
    else if (pos === 'bottom-right') positionStyles = 'bottom: 8px; right: 8px;';
    else if (pos === 'bottom-left') positionStyles = 'bottom: 8px; left: 8px;';
    
    this._starButton.style.cssText = `
      position: absolute;
      ${positionStyles}
      z-index: 10;
      width: ${size};
      height: ${size};
      padding: 0;
      margin: 0;
      background: rgba(0, 0, 0, 0.3);
      border: none;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, color 0.2s, background 0.2s;
      color: rgba(255, 255, 255, 0.5);
      --mdc-icon-size: calc(${size} * 0.65);
    `;
    
    this._starButton.innerHTML = '<ha-icon icon="mdi:star-outline"></ha-icon>';
    this._starButton.addEventListener('click', (e) => this._toggleFavorite(e));
    
    this.appendChild(this._starButton);
    
    if (this._config.card) {
      const cardConfig = { ...this._config.card };
      
      if (cardConfig.type?.startsWith('custom:')) {
        const tag = cardConfig.type.replace('custom:', '');
        this._cardElement = document.createElement(tag);
      } else {
        this._cardElement = document.createElement(`hui-${cardConfig.type}-card`);
      }
      
      if (this._cardElement.setConfig) {
        this._cardElement.setConfig(cardConfig);
      }
      
      if (this._hass) {
        this._cardElement.hass = this._hass;
      }
      
      this.appendChild(this._cardElement);
    }
  }

  getCardSize() {
    return this._cardElement?.getCardSize?.() || 1;
  }

  static getStubConfig() {
    return {
      entity: '',
      button_position: 'top-right',
      button_size: '24px',
      card: { type: 'button', entity: '' }
    };
  }
}

if (!customElements.get('favoritable-card')) {
  customElements.define('favoritable-card', FavoritableCard);
}
window.customCards = window.customCards || [];
if (!window.customCards.find(c => c.type === 'favoritable-card')) {
  window.customCards.push({ type: 'favoritable-card', name: 'Favoritable Card', description: 'Wrap any card with a favorite star' });
}
console.info('%c FAVORITABLE-CARD %c v2.2.1 ', 'background: #FFD700; color: black; font-weight: bold;', 'background: #333; color: white;');
