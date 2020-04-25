import {BaseElement} from '../Core/BaseElement.js';
import {Store} from '../Core/Store.js';
import {html} from '../vendor/lighterhtml.js';
import {toggleCategory, setCategoriesOrder} from '../Actions/ScheduleActions.js';
import Sortable from '../vendor/sortable.complete.esm.js';

customElements.define('prayer-moment-configure', class PrayerMomentConfigure extends BaseElement {

  async connectedCallback() {
    let slug = this.root.router.part(2);

    this.draw();
    let list = this.querySelector('.categories');
    this.sortable = Sortable.create(list, {
      onUpdate: () => {
        let order = {};
        [...list.children].forEach((child, index) => {
          order[child.dataset.slug] = index;
        });
        setCategoriesOrder(slug, order);
      }
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.sortable.destroy();
  }

  draw () {
    let s = Store.getState().schedule;
    let slug = this.root.router.part(2);
    let moment = s.moments.find(moment => moment.slug === slug);
    let categories = [...moment.prayerCategories].sort((a, b) => a.order - b.order);

    let t = this.root.t;

    let categoryIsEnabled = (categorySlug) => {
      let category = categories.find(category => category.slug === categorySlug);
      if (category) {
        return category.enabled;
      }
    };

    return html`
      <h1>${t.direct(moment.name)}</h1>

      <div class="categories">
      ${categories.map(category => html`
        <div class="prayer-category" data-slug="${category.slug}">
          <input type="checkbox" id="toggle-${category.slug}" 
          checked="${categoryIsEnabled(category.slug)}" 
          onchange="${() => {toggleCategory(moment.slug, category.slug); this.draw()}}">
          
          <label for="toggle-${category.slug}">${t.direct(category.name)}</label>
          <a href="/prayer-category/${category.slug}" class="tooltip">i</a>
        </div>
      `)}
      </div>
      
      <a href="/settings">${t`Settings`}</a>
    `;
  }
});
