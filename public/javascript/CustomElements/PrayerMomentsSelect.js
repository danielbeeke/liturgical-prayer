import {BaseElement} from '../Core/BaseElement.js';
import {Store} from '../Core/Store.js';
import {html} from '../vendor/lighterhtml.js';
import {toggleMoment, setMomentTime} from '../Actions/ScheduleActions.js';

customElements.define('prayer-moments-select', class PrayerMomentsSelect extends BaseElement {

  connectedCallback() {
    this.draw()
  }

  draw () {
    let t = this.root.t;
    let s = Store.getState().schedule;

    return html`
      <h1>${t`On which moments do you want to pray?`}</h1>

      ${s.moments.map(moment => html`
        <div>
          <input type="checkbox" id="toggle-${moment.slug}" checked="${moment.enabled}" onchange="${() => {toggleMoment(moment.slug); this.draw()}}">
          <label for="toggle-${moment.slug}">
          ${moment.enabled ? 
            html`<a href="${'/settings/' + moment.slug}">${t.direct(moment.name)}</a>` : 
            html`<span>${t.direct(moment.name)}</span>
          `}
          </label>
        </div>
      `)}

      <prayer-menu />
    `;
  }
});
