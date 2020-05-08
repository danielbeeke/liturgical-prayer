import {BaseElement} from '../Core/BaseElement.js';
import {Store} from '../Core/Store.js';
import {html} from '../vendor/uhtml.js';

customElements.define('prayer-about', class PrayerHome extends BaseElement {

  draw () {
    let s = Store.getState().schedule;
    let t = this.root.t;

    this.dataset.items = s.moments.filter(moment => moment.enabled).length.toString();

    return html`
      <h2 class="page-title">${t`About`}</h2>
    `;
  }
});