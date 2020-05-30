import {BaseElement} from '../Core/BaseElement.js';
import {html} from '../vendor/uhtml.js';
import {Store} from '../Core/Store.js';
import {addPrayerPoint} from '../Actions/ScheduleActions.js';

export class PrayerCategoryPrayerPointCreate extends BaseElement {

  constructor() {
    super(import.meta);
  }

  draw() {
    let t = this.root.t;
    let s = Store.getState().schedule;
    this.moment = s.moments.find(moment => moment.slug === this.route.parameters.moment);
    this.freeCategory = s.freeCategories.find(category => category.slug === this.route.parameters.category);
    this.addText = '';
    this.addDescription = '';

    this.categoryUrl = `/settings/${this.route.parameters.moment}/prayer-category/${this.route.parameters.category}`;

    return html`
      <h2 class="page-title">
        <a class="back-button" href="${this.categoryUrl}"><prayer-icon name="arrow-left" /></a>
        ${t.direct('Create prayer point')}
      </h2>
      
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
        <button class="button" onclick="${() => this.addPrayerPoint()}">${t.direct('Add')}</button>        
      </div>

      
      <div class="end"></div>
      
    `
  }

  addPrayerPoint () {
    addPrayerPoint(this.moment.slug, this.freeCategory.slug, this.addText, this.addDescription);
    this.addText = null;
    this.addDescription = null;
    this.root.router.navigate(this.categoryUrl);
  }
}