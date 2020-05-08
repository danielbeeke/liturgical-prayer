import {BaseElement} from '../Core/BaseElement.js';
import {html} from '../vendor/uhtml.js';
import {Store} from '../Core/Store.js';
import {deleteFreeCategory, addPrayerPoint, deletePrayerPoint, setPrayerPointsOrder} from '../Actions/ScheduleActions.js';
import {Sortable} from '../Helpers/Sortable.js';

customElements.define('prayer-category-details', class PrayerCategoryDetails extends BaseElement {

  constructor() {
    super();
    this.addText = '';
  }

  connectedCallback() {
    super.connectedCallback();
    let list = this.querySelector('.prayer-items');

    if (list) {
      this.sortable = new Sortable(list);
      list.addEventListener('sorted', () => {
        let prayerPoints = [...list.children].map(child => child.dataset.name);

        // Sort them to their original place so lighterHTML may do its work.
        [...list.children]
        .sort((a,b)=> a.dataset.order > b.dataset.order ? 1 : -1)
        .map(node => list.appendChild(node));

        setPrayerPointsOrder(this.moment.slug, this.category.slug, prayerPoints);
        this.draw();
      });
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.sortable) this.sortable.destroy();
  }

  addPrayerPoint () {
    addPrayerPoint(this.moment.slug, this.category.slug, this.addText);
    this.addText = null;
  }

  draw () {
    let t = this.root.t;

    let s = Store.getState().schedule;
    this.moment = s.moments.find(moment => moment.slug === this.route.parameters.moment);
    this.category = this.moment.prayerCategories.find(category => category.slug === this.route.parameters.category);
    this.freeCategory = s.freeCategories.find(category => category.slug === this.route.parameters.category);

    if (!this.category) {
      this.root.router.navigate('/settings');
    }

    return html`
      <h2 class="page-title">${this.category.name}</h2>
      <p>${this.category.description}</p>

      ${this.category.isFreeForm ? html`
        <div class="prayer-items sortable item-list">
        ${this.freeCategory.items.map((item, index) => html`
          <div class="item" data-name="${item}" data-order="${index}">
              <span>${item}</span>
              <button onclick="${() => {deletePrayerPoint(this.moment.slug, this.category.slug, item); this.draw()}}" class="button small">${t.direct('Delete')}</button>
          </div>
        `)}
        </div>
        
        <div class="field">
          <label>${this.freeCategory.items.length ? t.direct('Add another') : t.direct('Add your first prayer point')}</label>
          <div class="field-inner">
            <input .value="${this.addText}" onchange="${event => this.addText = event.target.value}" type="text">
            <button class="button" onclick="${() => {this.addPrayerPoint(); this.draw()}}">${t.direct('Add')}</button>          
          </div>
        </div>      
        
        <button class="button" onclick="${() => {deleteFreeCategory(this.moment.slug, this.category.slug); this.root.router.navigate(`/settings/${this.moment.slug}`)}}">${t.direct('Delete category')}</button>
      ` : html``}
    `;
  }
});