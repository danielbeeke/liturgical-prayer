import {BaseElement} from '../Core/BaseElement.js';
import {html} from '../vendor/uhtml.js';

customElements.define('prayer-main-menu', class PrayerMenu extends BaseElement {

  draw () {
    let t = this.root.t;

    return html`
      <div class="main-menu">

        <a class="menu-item" href="/home">
          <prayer-icon name="compass" />
          <span class="title">${t.direct('Home')}</span>
        </a>

        <a class="menu-item" href="/how-to-pray">
          <prayer-icon name="face" />
          <span class="title">${t.direct('How to pray')}</span>
        </a>

        <a class="menu-item" href="/privacy">
          <prayer-icon name="shield" />
          <span class="title">${t.direct('Privacy and security')}</span>
        </a>

        <a class="menu-item" href="/about">
          <prayer-icon name="info_big" />
          <span class="title">${t.direct('About')}</span>
        </a>
        
        <a class="menu-item" href="/settings">
          <prayer-icon name="settings" />
          <span class="title">${t.direct('Settings')}</span>
        </a>

      </div>

    `;
  }
});
