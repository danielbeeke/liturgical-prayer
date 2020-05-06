import {BaseElement} from '../Core/BaseElement.js';
import {Store} from '../Core/Store.js';
import {html} from '../vendor/uhtml.js';
import {toggleMoment} from '../Actions/ScheduleActions.js';
import {setLanguage} from '../Actions/AppActions.js';

customElements.define('prayer-settings', class PrayerSettings extends BaseElement {

  connectedCallback() {
    this.draw()
  }

  draw () {
    let t = this.root.t;
    let s = Store.getState().schedule;
    let a = Store.getState().app;

    return html`
      <h2>${t`On which moments do you want to pray?`}</h2>

      ${s.moments.map(moment => html`
        <div class="${'moment ' + moment.enabled ? 'enabled' : ''}">
          <input type="checkbox" id="${'toggle-' + moment.slug}" checked="${moment.enabled}" onchange="${() => {toggleMoment(moment.slug); this.draw()}}">
          <label for="${'toggle-' + moment.slug}">
            <prayer-icon name="${moment.icon}" />
            <a href="${'/settings/' + moment.slug}">${t.direct(moment.name)}</a>
          </label>
        </div>
      `)}
      
      <h2>${t`What language do you speak?`}</h2>
      
      <div class="field">
        <label>${t`Interface language`}</label>
        <select onchange="${event => setLanguage(event.target.value)}">
            ${['English', 'Dutch'].map(language => html`
                <option value="${language}" selected="${a.language === language}">${t.direct(language)}</option>
            `)}            
        </select>
      </div>
    `;
  }
});
