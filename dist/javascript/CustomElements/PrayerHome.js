import {BaseElement} from '../Core/BaseElement.js';
import {Store} from '../Core/Store.js';
import {html} from '../vendor/lighterhtml.js';

customElements.define('prayer-home', class PrayerHome extends BaseElement {

  draw () {
    let s = Store.getState().schedule;
    let t = this.root.t;

    this.dataset.items = s.moments.filter(moment => moment.enabled).length;

    return html`
    ${s.moments.map(moment => moment.enabled ? html`
      <div>
      <a class="prayer-moment" href="${'/pray/' + moment.slug}">
        <span class="inner">${t.direct(moment.name)}</span>
      </a>
      </div>
    ` : html``)}

    <div>
        <a href="/settings">${t`Settings`}</a>
    </div>

    `;
  }
});
