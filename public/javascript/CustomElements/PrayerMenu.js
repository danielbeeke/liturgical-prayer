import {BaseElement} from '../Core/BaseElement.js';
import {html} from '../vendor/uhtml.js';

export class PrayerMenu extends BaseElement {

  draw () {
    let t = window.t;

    return html`
      <a class="${'menu-item' + (location.pathname === '/settings' ? ' active' : '')}" href="/settings">
        <prayer-icon name="settings" />
        <span class="title">${t.direct('Settings')}</span>
      </a>

      <a class="${'menu-item' + (location.pathname === '/pray' ? ' active' : '')}" href="/pray">
        <prayer-icon name="compass" />
        <span class="title">${t.direct('Home')}</span>
      </a>

      <a class="${'menu-item' + (location.pathname === '/menu' ? ' active' : '')}" href="/menu">
        <prayer-icon name="dots" />
        <span class="title">${t.direct('Menu')}</span>
      </a>

    `;
  }
}