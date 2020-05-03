import {BaseElement} from '../Core/BaseElement.js';
import {Store} from '../Core/Store.js';
import {html} from '../vendor/lighterhtml.js';
import {toggleCategory, setCategoriesOrder} from '../Actions/ScheduleActions.js';
import {Sortable} from '../Helpers/Sortable.js';

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
      <a class="button" href="/settings">${t.direct('Back')}</a>
      <h2>${t.direct(moment.name)}</h2>
      <a class="button" href="/settings/${this.route.parameters.moment}/create-free-category">${t.direct('Create category')}</a>

      <div class="categories sortable">
      ${categories.map(category => html`
        <div class="prayer-category ${categoryIsEnabled(category.slug) ? 'enabled' : ''}" data-order="${category.order}" data-slug="${category.slug}">
          <input type="checkbox" id="toggle-${category.slug}" 
          checked="${categoryIsEnabled(category.slug)}" 
          onchange="${() => {toggleCategory(moment.slug, category.slug); this.draw()}}">
          <label for="toggle-${category.slug}">
            <prayer-icon name="${category.icon}"></prayer-icon>
            ${t.direct(category.name)}
          </label>
          <a href="/settings/${this.route.parameters.moment}/prayer-category/${category.slug}" class="button small">${category.isFreeForm ? t.direct('Edit') : t.direct('Read more')}</a>
        </div>
      `)}
      </div>
    `;
  }
});
