import {BaseElement} from '../Core/BaseElement.js';
import {html} from '../vendor/lighterhtml.js';
import {Store} from '../Core/Store.js';
import {deleteFreeCategory, addPrayerPoint, deletePrayerPoint} from '../Actions/ScheduleActions.js';

customElements.define('prayer-category-details', class PrayerCategoryDetails extends BaseElement {

  constructor() {
    super();
    this.addText = '';
  }

  addPrayerPoint () {
    addPrayerPoint(this.moment.slug, this.category.slug, this.addText);
    this.addText = null;
  }

  draw () {
    let s = Store.getState().schedule;
    let momentSlug = this.root.router.part(2);
    this.moment = s.moments.find(moment => moment.slug === momentSlug);
    let slug = this.root.router.part(4);
    this.category = this.moment.prayerCategories.find(category => category.slug === slug);
    let t = this.root.t;

    return html`
      <a href="/settings/${this.moment.slug}">${t.direct('Back')}</a>
      <h1>${this.category.name}</h1>
      <p>${this.category.description}</p>

      ${this.category.items.map(item => html`
        <span>${item}</span><button onclick="${() => {deletePrayerPoint(this.moment.slug, this.category.slug, item); this.draw()}}" class="button">${t.direct('Delete')}</button>
      `)}
      
      <label>${this.category.items.length ? t.direct('Add another') : t.direct('Add your first prayer point')}</label>
      <input name="add-text" value="${this.addText}" onchange="${event => this.addText = event.target.value}" type="text">
      <button onclick="${() => {this.addPrayerPoint(); this.draw()}}">${t.direct('Add')}</button>
      
      ${this.category.isFreeForm ? html`<button class="button" onclick="${() => {deleteFreeCategory(this.moment.slug, this.category.slug); this.root.router.navigate(`/settings/${this.moment.slug}`)}}">${t.direct('Delete category')}</button>` : html``}
    `;
  }
});