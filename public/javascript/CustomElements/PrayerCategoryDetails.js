import {BaseElement} from '../Core/BaseElement.js';
import {html} from '../vendor/uhtml.js';
import {Store} from '../Core/Store.js';
import {deleteFreeCategory, addPrayerPoint, deletePrayerPoint, setPrayerPointsOrder} from '../Actions/ScheduleActions.js';
import {Sortable} from '../Helpers/Sortable.js';

customElements.define('prayer-category-details', class PrayerCategoryDetails extends BaseElement {

  constructor() {
    super();
    this.addText = '';
    this.addDescription = '';
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
    addPrayerPoint(this.moment.slug, this.category.slug, this.addText, this.addDescription);
    this.addText = null;
    this.addDescription = null;
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
      <h2 class="page-title">
        <a class="back-button" href="${'/settings/' + this.moment.slug}"><prayer-icon name="arrow-left" /></a>
        ${this.category.name}
      </h2>
      <p>${this.category.description}</p>

      ${this.category.isFreeForm && this.freeCategory.items.length ? html`
        <div class="field">
          <label>${t`Your prayer points`}</label>
          <div class="prayer-items sortable item-list">
          ${this.freeCategory.items.map((item, index) => html`
            <div class="item prayer-point enabled" data-name="${item}" data-order="${index}">
              <prayer-icon name="handle" />
              <label>
                <span class="title">${item.title}</span>
                ${item.description ? html`<em class="description">${item.description}</em>` : html``}
              </label>
              <a href="${`/settings/${this.moment.slug}/prayer-category/${this.freeCategory.slug}/${item.slug}`}"><prayer-icon name="pencil" /></a>
            </div>
          `)}
          </div>
        </div>
      ` : html``}
      ${this.category.isFreeForm ? html`
        <div class="field">
          <label>${t.direct('Add a prayer point')}</label>
          <div class="field-inner">
            <input .value="${this.addText}" onchange="${event => this.addText = event.target.value}" type="text">
          </div>
        </div>      
        
        <div class="field">
          <label>${t.direct('Add a description (optional)')}</label>
          <div class="field-inner">
            <textarea onchange="${event => this.addDescription = event.target.value}" .value="${this.addDescription}"></textarea>
          </div>
        </div>      

        <div class="row">
          <button class="button" onclick="${() => {this.addPrayerPoint(); this.draw()}}">${t.direct('Add')}</button>        
        </div>

        <button class="button danger" onclick="${() => {deleteFreeCategory(this.moment.slug, this.category.slug); this.root.router.navigate(`/settings/${this.moment.slug}`)}}">
            ${t.direct('Delete category')}
            <prayer-icon name="remove" />
        </button>        

        
        <div class="end"></div>
      ` : html``}
    `;
  }
});