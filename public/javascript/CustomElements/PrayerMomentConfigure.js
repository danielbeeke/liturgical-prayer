import {BaseElement} from '../Core/BaseElement.js';
import {Store} from '../Core/Store.js';
import {html} from '../vendor/lighterhtml.js';
import {PrayerData} from '../Helpers/PrayerData.js';
import {toggleCategory, setCategoriesOrder} from '../Actions/ScheduleActions.js';
import Sortable from '../vendor/sortable.complete.esm.js';

customElements.define('prayer-moment-configure', class PrayerMomentConfigure extends BaseElement {

  async connectedCallback() {
    let prayerData = new PrayerData();
    let momentName = this.root.router.part(2);
    let s = Store.getState().schedule;
    let moment = s.moments.find(moment => moment.name.toLowerCase() === momentName);
    this.categories = await prayerData.categories();
    this.categories = this.categories.sort((a, b) => {
      let aInstance = moment.prayerCategories.find(category => category.name === a.name);
      let bInstance = moment.prayerCategories.find(category => category.name === b.name);
      return aInstance.order - bInstance.order;
    });

    this.draw();
    let list = this.querySelector('.categories');
    this.sortable = Sortable.create(list, {
      onUpdate: () => {
        let order = {};
        [...list.children].forEach((child, index) => {
          order[child.dataset.name] = index;
        });
        setCategoriesOrder(moment.name, order);
      }
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.sortable.destroy();
  }

  draw () {
    let s = Store.getState().schedule;
    let momentName = this.root.router.part(2);
    let moment = s.moments.find(moment => moment.name.toLowerCase() === momentName);
    let t = this.root.t;

    let categoryIsEnabled = (categoryName) => {
      let category = moment.prayerCategories.find(category => category.name === categoryName);
      if (category) {
        return category.enabled;
      }
    };

    return html`
      <h1>${t.direct(moment.name)}</h1>

      <div class="categories">
      ${this.categories.map(category => html`
        <div class="prayer-category" data-name="${category.name}">
          <input type="checkbox" id="toggle-${category.name}" 
          checked="${categoryIsEnabled(category.name)}" 
          onchange="${() => {toggleCategory(moment.name, category.name); this.draw()}}">
          
          <label for="toggle-${category.name}">${t.direct(category.name)}</label>
          <a href="/prayer-category/${category.name}" class="tooltip">i</a>
        </div>
      `)}
      </div>
      
      <a href="/settings">${t`Settings`}</a>
    `;
  }
});
