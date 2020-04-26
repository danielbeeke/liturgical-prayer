import {BaseElement} from '../Core/BaseElement.js';
import {Store} from '../Core/Store.js';
import {html} from '../vendor/lighterhtml.js';
import {toggleCategory, setCategoriesOrder} from '../Actions/ScheduleActions.js';
import {Sortable} from '../Helpers/Sortable.js';

customElements.define('prayer-moment-configure', class PrayerMomentConfigure extends BaseElement {

  async connectedCallback() {
    let slug = this.root.router.part(2);

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

      setCategoriesOrder(slug, order);
      this.draw();
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.sortable.destroy();
    this.sortable = null;
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

      <a class="button" href="/settings/${slug}/create-free-category">${t.direct('Create category')}</a>

      <div class="categories sortable">
      ${categories.map(category => html`
        <div class="prayer-category" data-order="${category.order}" data-slug="${category.slug}">
          <input type="checkbox" id="toggle-${category.slug}" 
          checked="${categoryIsEnabled(category.slug)}" 
          onchange="${() => {toggleCategory(moment.slug, category.slug); this.draw()}}">
          
          <span>${t.direct(category.name)}</span>
          <a href="/settings/${slug}/prayer-category/${category.slug}" class="tooltip">${category.isFreeForm ? t.direct('Edit') : 'i'}</a>
        </div>
      `)}
      </div>
      
      <a href="/settings">${t`Settings`}</a>
    `;
  }
});
