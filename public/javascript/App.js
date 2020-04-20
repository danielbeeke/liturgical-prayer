/**
 * This file is a CustomElement but for convenience it is placed in the root of the application.
 * This is the starting file of this application.
 *
 * Created by Daniël Beeke
 */
import {BaseElement} from './Core/BaseElement.js';
import {Store} from './Core/Store.js';
import {html} from './vendor/lighterhtml.js';
import './CustomElements/PrayerScheduleWidget.js';
import './vendor/polyfill.js';
import {I14n} from './Helpers/I14n.js';

customElements.define('prayer-app', class PrayerApp extends BaseElement {

  /**
   * This is the main startup function of the app.
   */
  async connectedCallback () {
    let language = localStorage.getItem('language') ?? 'English';
    window.t = await I14n(language);
    this.draw();
  }

  draw () {
    let user = Store.getState().user;
    let name = user.name;

    return html`
        <h1>${t`Welcome! ${{name}}, how are you today?`}</h1>
    `;
  }

});