import {BaseElement} from '../Core/BaseElement.js';
import {Store} from '../Core/Store.js';
import {html} from '../vendor/lighterhtml.js';

customElements.define('prayer-home', class PrayerSelect extends BaseElement {

  draw () {
    let s = Store.getState().schedule;
    let t = this.root.t;

    return html`
    <h1>${t`Welcome!`}</h1>
    
    ${s.moments.map(moment => moment.enabled ? html`
      <div>
        <a href="${'/pray/' + moment.name.toLowerCase()}">${t.direct(moment.name)}</a>
      </div>
    ` : html``)}

    <a href="/settings">${t`Settings`}</a>

    `;
  }
});

export const routes = {
  'home': {
    template: html`<prayer-home />`
  }
};