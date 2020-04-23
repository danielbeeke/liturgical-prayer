import {BaseElement} from '../Core/BaseElement.js';
import {Store} from '../Core/Store.js';
import {html, svg} from '../vendor/lighterhtml.js';

customElements.define('prayer-home', class PrayerSelect extends BaseElement {

  draw () {
    return html`
    <h1>${this.root.t`Welcome!`}</h1>
    <a href="/prayer-times">Prayer times</a>
    `;
  }
});

export const routes = {
  'home': {
    template: html`<prayer-home />`
  }
};