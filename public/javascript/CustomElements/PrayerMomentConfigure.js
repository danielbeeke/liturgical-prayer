import {BaseElement} from '../Core/BaseElement.js';
import {Store} from '../Core/Store.js';
import {html} from '../vendor/uhtml.js';
import {toggleCategory, setCategoriesOrder, setMomentTime} from '../Actions/ScheduleActions.js';
import {Sortable} from '../Helpers/Sortable.js';
import {addWbr} from '../Helpers/addWbr.js';

export class PrayerMomentConfigure extends BaseElement {

  constructor() {
    super(import.meta);
  }

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

  setTime () {
    setMomentTime(this.route.parameters.moment, this.from, this.till);
  }

  draw () {
    let s = Store.getState().schedule;
    let moment = s.moments.find(moment => moment.slug === this.route.parameters.moment);
    this.from = moment.from;
    this.till = moment.till;
    let categories = [...moment.prayerCategories].sort((a, b) => a.order - b.order);

    let t = this.root.t;

    let categoryIsEnabled = (categorySlug) => {
      let category = categories.find(category => category.slug === categorySlug);
      if (category) {
        return category.enabled;
      }
    };

    return html`
      <h2 class="page-title">
        <a class="back-button" href="/settings"><prayer-icon name="arrow-left" /></a>
        ${t.direct(moment.name)}
      </h2>

      <div class="field">
        <label>${t`Prayer categories`}</label>
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
              <img  src="${`/images/${category.isFreeForm ? 'pencil' : 'info'}.svg`}" />
            </a>
          </div>
        `)}
        </div>      
      </div>
      
      <div class="field">
        <label>${t.direct('Create your own category')}</label>
        <p>
          ${t`Do you want to pray for your family, friends, church or city? Create category and add your own prayer points.`}
          <br /><br />
          <a class="button has-icon" href="${`/settings/${this.route.parameters.moment}/create-free-category`}">
          ${t.direct('Create category')}
          <prayer-icon name="arrow-right" />
        </a>
        </p>      
      </div>
      
      <div class="row">
        <div class="field">
          <label>${t.direct('From')}</label>
          <small class="description">${t`Usually starts at:`}</small>
          <input value="${moment.from}" type="time" onchange="${event => {this.from = event.target.value; this.setTime()}}">        
        </div>
        
         <div class="field">
          <label>${t.direct('Till')}</label>
          <small class="description">${t`Usually ends at:`}</small>
          <input value="${moment.till}" type="time" onchange="${event => {this.till = event.target.value; this.setTime()}}">
        </div>

        <p class="description">${t`We use this information to scroll to the right moment when you open the app.`}</p>
   
      </div>
    
     
      <div class="end"></div>
    `;
  }
}