import {BaseElement} from '../Core/BaseElement.js';
import {html} from '../vendor/uhtml.js';

customElements.define('prayer-menu', class PrayerMenu extends BaseElement {

  draw () {
    let t = this.root.t;

    return html`
      <a class="menu-item" href="/about">
        <prayer-icon name="info_big" />
        <span class="title">${t.direct('About')}</span>
      </a>
      <a class="menu-item" href="/pray">
        <prayer-icon name="compass" />
        <span class="title">${t.direct('Home')}</span>
      </a>
      <a class="menu-item" href="/settings">
        <prayer-icon name="settings" />
        <span class="title">${t.direct('Settings')}</span>
      </a>

    `;
  }
});
