import {BaseElement} from '../Core/BaseElement.js';
import {Store} from '../Core/Store.js';
import {html} from '../vendor/uhtml.js';
import {toggleMoment} from '../Actions/ScheduleActions.js';
import {setBible} from '../Actions/AppActions.js';
import {Content} from '../Content.js';

customElements.define('prayer-settings', class PrayerSettings extends BaseElement {

  connectedCallback() {
    this.draw();
  }

  draw () {
    let t = this.root.t;
    let s = Store.getState().schedule;
    let a = Store.getState().app;
    let bibles = Content.Bibles;
    let englishBibles = bibles.filter(bible => bible.language.id === 'eng');

    return html`
      <h2 class="page-title">
        <prayer-icon name="settings" />
        ${t.direct('Settings')}
      </h2>

      <div class="field">
        <label>
          ${t.direct('Moments and settings')}
        </label>
        
        <div class="item-list">
        ${s.moments.map(moment => html`
          <div class="${'item moment ' + (moment.enabled ? 'enabled' : '')}" style="${`--color-primary: ${moment.color};`}">
            <input type="checkbox" id="${'toggle-' + moment.slug}" .checked="${moment.enabled}" onchange="${() => {toggleMoment(moment.slug); this.draw()}}">
            <label for="${'toggle-' + moment.slug}">
              <span class="title">${t.direct(moment.name)}</span>
            </label>
            <a href="${'/settings/' + moment.slug}">
              <prayer-icon name="pencil" />
            </a>
          </div>
        `)}
        </div>
      </div>

      <div class="field">
        <label>${t`Bible translation`}</label>
        <select onchange="${event => setBible(event.target.value)}">
            ${englishBibles.map(bible => html`
                <option value="${bible.id}" .selected="${a.bible === bible.id}">${bible.name}</option>
            `)}            
        </select>
      </div>
      
      <div class="field">
        <label>${t`Sync data`}</label>
        <remote-storage-widget />
      </div>
      
      
      <div class="end"></div>
    `;
  }
});
