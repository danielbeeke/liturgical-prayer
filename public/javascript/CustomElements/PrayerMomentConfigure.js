import {BaseElement} from '../Core/BaseElement.js';
import {Store} from '../Core/Store.js';
import {html} from '../vendor/uhtml.js';
import {toggleCategory, setCategoriesOrder} from '../Actions/ScheduleActions.js';
import {Sortable} from '../Helpers/Sortable.js';
import {addWbr} from '../Helpers/addWbr.js';

customElements.define('prayer-moment-configure', class PrayerMomentConfigure extends BaseElement {

  async connectedCallback() {
    this.draw();
    let list = this.querySelector('.categories');

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

      setCategoriesOrder(this.route.parameters.moment, order);
      this.draw();
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.sortable.destroy();
  }

  draw () {
    let s = Store.getState().schedule;
    let moment = s.moments.find(moment => moment.slug === this.route.parameters.moment);
    let categories = [...moment.prayerCategories].sort((a, b) => a.order - b.order);

    let t = this.root.t;

    let categoryIsEnabled = (categorySlug) => {
      let category = categories.find(category => category.slug === categorySlug);
      if (category) {
        return category.enabled;
      }
    };

    return html`
      <h2>${t.direct(moment.name)}</h2>

      <div class="categories sortable item-list">
      ${categories.map(category => html`
        <div class="${'prayer-category item ' + (categoryIsEnabled(category.slug) ? 'enabled' : '')}" data-order="${category.order}" data-slug="${category.slug}">
          <prayer-icon name="handle" />
          <input type="checkbox" id="${'toggle-' + category.slug}" 
          .checked="${categoryIsEnabled(category.slug)}" 
          onchange="${() => {toggleCategory(moment.slug, category.slug); this.draw()}}">
          <label for="${'toggle-' + category.slug}">
            <span class="title">${addWbr(t.direct(category.name))}</span>
          </label>
          <a href="${`/settings/${this.route.parameters.moment}/prayer-category/${category.slug}`}">
            <prayer-icon name="${category.isFreeForm ? 'pencil' : 'info'}" />
          </a>
        </div>
      `)}
      </div>
      
      <a class="button" href="${`/settings/${this.route.parameters.moment}/create-free-category`}">
        ${t.direct('Create category')}
        <prayer-icon name="arrow-right" />
      </a>
      
    `;
  }
});
