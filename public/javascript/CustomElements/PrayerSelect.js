import {BaseElement} from '../Core/BaseElement.js';
import {Store} from '../Core/Store.js';
import {html, svg} from '../vendor/lighterhtml.js';

customElements.define('prayer-selects', class PrayerSelect extends BaseElement {

  connectedCallback() {
    this.draw()
  }

  draw () {
    let prayerSchedule = Store.getState().prayerSchedule;

    return html`<h1>Prayer selects</h1><a href="/home">home</a>`;
  }
});

export const routes = {
  'prayer-times': {
    template: html`<prayer-selects />`
  }
};