import {BaseElement} from '../Core/BaseElement.js';
import {html} from '../vendor/lighterhtml.js';
import {Slugify} from '../Helpers/Slugify.js';

customElements.define('prayer-category-details', class PrayerCategoryDetails extends BaseElement {

  draw () {
    let momentSlug = this.root.router.part(2);
    let slug = this.root.router.part(4);
    let t = this.root.t;
    let category = prayerData['Categories'].find(category => Slugify(category.Title) === slug);

    return html`
      <a href="/settings/${momentSlug}">${t.direct('Back')}</a>
      <h1>${category.Title}</h1>
      <p>${category.Description}</p>
    `;
  }
});