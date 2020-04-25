import {BaseElement} from '../Core/BaseElement.js';
import {html} from '../vendor/lighterhtml.js';
import {Store} from '../Core/Store.js';

customElements.define('prayer-category-details', class PrayerCategoryDetails extends BaseElement {

  draw () {
    let t = this.root.t;
    let s = Store.getState().schedule;
    let momentSlug = this.root.router.part(2);
    let moment = s.moments.find(moment => moment.slug === momentSlug);
    let slug = this.root.router.part(4);
    let category = moment.prayerCategories.find(category => category.slug === slug);

    return html`
      <a href="/settings/${momentSlug}">${t.direct('Back')}</a>
      <h1>${category.name}</h1>
      <p>${category.description}</p>
    `;
  }
});