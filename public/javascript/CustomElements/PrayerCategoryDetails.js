import {BaseElement} from '../Core/BaseElement.js';
import {html} from '../vendor/uhtml.js';
import {Store} from '../Core/Store.js';
import {deleteFreeCategory, setPrayerPointsOrder} from '../Actions/ScheduleActions.js';
import {Sortable} from '../Helpers/Sortable.js';

export class PrayerCategoryDetails extends BaseElement {

  connectedCallback() {
    super.connectedCallback();
    let list = this.querySelector('.prayer-items');

    if (list) {
      this.sortable = new Sortable(list);
      list.addEventListener('sorted', () => {
        let order = {};
        [...list.children].forEach((child, index) => {
          order[child.dataset.slug] = index;
        });

        // Sort them to their original place so lighterHTML may do its work.
        [...list.children]
        .sort((a,b)=> a.dataset.order > b.dataset.order ? 1 : -1)
        .map(node => list.appendChild(node));

        setPrayerPointsOrder(this.moment.slug, this.category.slug, order);
        this.draw();
      });
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.sortable) this.sortable.destroy();
  }

  draw () {
    let t = window.t;

    let s = Store.getState().schedule;
    this.moment = s.moments.find(moment => moment.slug === this.route.parameters.moment);
    this.category = this.moment.prayerCategories.find(category => category.slug === this.route.parameters.category);
    this.freeCategory = s.freeCategories.find(category => category.slug === this.route.parameters.category);

    if (!this.category) {
      this.root.router.navigate('/settings');
    }

    return html`
      <prayer-main-menu />
      <div class="inner-page">
        <h2 class="page-title">
          <a class="back-button" href="${'/settings/' + this.moment.slug}"><prayer-icon name="arrow-left" /></a>
          ${this.category.name}
        </h2>
        <p>${this.category.description}</p>
  
        ${this.category.isFreeForm && this.freeCategory.items.length ? html`
          <div class="field">
            <label>${t`Your prayer points`}</label>
            <div class="prayer-items sortable item-list">
            ${[...this.freeCategory.items].sort((a, b) => a.order - b.order).map((item, index) => html`
              <div class="item prayer-point enabled" data-slug="${item.slug}" data-order="${item.order}">
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
          <a class="button has-icon" href="${`/settings/${this.moment.slug}/prayer-category/${this.category.slug}/create`}">
            ${t.direct('Create prayer point')}
            <prayer-icon name="arrow-right" />
          </a>
          
          <button class="button danger has-icon" onclick="${() => {deleteFreeCategory(this.moment.slug, this.category.slug); this.root.router.navigate(`/settings/${this.moment.slug}`)}}">
              ${t.direct('Delete category')}
              <prayer-icon name="remove" />
          </button>        
  
          
          <div class="end"></div>
        ` : html``}
      </div>
    `;
  }
}