import {BaseElement} from '../Core/BaseElement.js';
import {html} from '../vendor/uhtml.js';
import {Store} from '../Core/Store.js';
import {deletePrayerPoint, updatePrayerPoint} from '../Actions/ScheduleActions.js';

customElements.define('prayer-category-prayer-point', class PrayerCategoryPrayerPoint extends BaseElement {
  draw() {
    let t = this.root.t;
    let s = Store.getState().schedule;
    this.freeCategory = s.freeCategories.find(category => category.slug === this.route.parameters.category);
    let item = Object.assign({}, this.freeCategory.items.find(item => item.slug === this.route.parameters.item));

    let categoryUrl = `/settings/${this.route.parameters.moment}/prayer-category/${this.route.parameters.category}`;

    return html`
      <h2 class="page-title">
        <a class="back-button" href="${categoryUrl}"><prayer-icon name="arrow-left" /></a>
        ${item.title}
      </h2>
      
      <div class="field">
        <label>${t.direct('Title')}</label>
        <div class="field-inner">
          <input .value="${item.title}" onchange="${event => item.title = event.target.value}" type="text">
        </div>
      </div>      
      
      <div class="field">
        <label>${t.direct('Description (optional)')}</label>
        <div class="field-inner">
          <textarea onchange="${event => item.description = event.target.value}" .value="${item.description}"></textarea>
        </div>
      </div>      

      <div class="row">
        <button class="button" onclick="${() => {
          updatePrayerPoint(this.freeCategory.slug, item.slug, item.title, item.description); 
          this.root.router.navigate(categoryUrl)}
        }">${t.direct('Update')}</button>        
      </div>

        <button class="button danger has-icon" onclick="${() => {deletePrayerPoint(this.route.parameters.moment, this.freeCategory.slug, item.slug); this.root.router.navigate(categoryUrl)}}">
            ${t.direct('Delete')}
            <prayer-icon name="remove" />
        </button>        

        
        <div class="end"></div>
      
    `
  }
});