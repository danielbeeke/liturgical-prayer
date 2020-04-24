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
          <input type="checkbox" id="toggle-${moment.name}" checked="${moment.enabled}" onchange="${() => {toggleMoment(moment.name); this.draw()}}">
          <label for="toggle-${moment.name}">
          ${moment.enabled ? 
            html`<a href="${'/settings/' + moment.name.toLowerCase()}">${t.direct(moment.name)}</a>` : 
            html`<span>${t.direct(moment.name)}</span>
          `}
          </label>
          <input class="time" type="time" name="time-${moment.name}" value="${moment.time}" onchange="${event => {setMomentTime(moment.name, event.target.value); this.draw()}}">
        </div>
      `)}

      <a href="/home">home</a>
    `;
  }
});

export const routes = {
  'settings': {
    template: html`<prayer-moments-select />`
  }
};