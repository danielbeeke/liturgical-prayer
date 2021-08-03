import {BaseElement} from '../Core/BaseElement.js';
import {html} from 'https://cdn.skypack.dev/uhtml/async'

export class PrayerMenu extends BaseElement {

  draw () {
    let t = this.root.t;

    return html`
      <a class="${'menu-item' + (location.pathname === '/settings' ? ' active' : '')}" href="/settings">
        <prayer-icon name="settings" />
        <span class="title">${t.direct('Settings')}</span>
      </a>

      <a class="${'menu-item' + (location.pathname === '/pray' ? ' active' : '')}" href="/pray">
        <prayer-icon name="pray" />
        <span class="title">${t.direct('Home')}</span>
      </a>

      <a class="${'menu-item' + (location.pathname === '/menu' ? ' active' : '')}" href="/menu">
        <prayer-icon name="dots" />
        <span class="title">${t.direct('Menu')}</span>
      </a>

    `;
  }
}