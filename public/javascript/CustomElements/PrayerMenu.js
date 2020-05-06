import {BaseElement} from '../Core/BaseElement.js';
import {html} from '../vendor/uhtml.js';

customElements.define('prayer-menu', class PrayerMenu extends BaseElement {

  draw () {
    let t = this.root.t;

    return html`
      <a class="button" href="/pray">${t.direct('Home')}</a>
      <a class="button" href="/settings">${t.direct('Settings')}</a>
    `;
  }
});
