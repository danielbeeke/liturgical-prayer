import {BaseElement} from '../Core/BaseElement.js';
import {Store} from '../Core/Store.js';
import {html} from '../vendor/lighterhtml.js';

customElements.define('prayer-moment-configure', class PrayerMomentConfigure extends BaseElement {

  connectedCallback() {
    this.draw()
  }

  draw () {
    let s = Store.getState().schedule;
    let momentName = this.root.router.part(2);
    let moment = s.moments.find(moment => moment.name.toLowerCase() === momentName);
    let t = this.root.t;

    return html`
      <h1>${t.direct(moment.name)}</h1>

      ${s.prayerCategories.map(prayerCategory => html`
        
      `)}

      <a href="/settings">${t`Settings`}</a>
    `;
  }
});

export const routes = {
  'settings\/([a-z]*)': {
    template: html`<prayer-moment-configure />`
  }
};