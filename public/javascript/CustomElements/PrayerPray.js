import {BaseElement} from '../Core/BaseElement.js';
import {Store} from '../Core/Store.js';
import {html} from '../vendor/lighterhtml.js';

customElements.define('prayer-pray', class PrayerPray extends BaseElement {

  draw () {
    let s = Store.getState().schedule;
    let momentName = this.root.router.part(2);
    let moment = s.moments.find(moment => moment.name.toLowerCase() === momentName);
    let t = this.root.t;

    return html`
        <a href="/pray">Home</a>
        <h1>${t.direct(moment.name)}</h1>
    `;
  }
});