import {BaseElement} from '../Core/BaseElement.js';
import {Store} from '../Core/Store.js';
import {html} from '../vendor/uhtml.js';
import {PrayerScheduler} from '../Helpers/PrayerScheduler.js';
import {toLines} from '../Helpers/toLines.js';

customElements.define('prayer-day-overview', class PrayerDayOverview extends BaseElement {

  attributeChangedCallback () {
    this.draw();
  }

  static get observedAttributes() { return ['moment', 'date']; }

  draw () {
    let dateParts = this.route.parameters.date.split('-');
    this.year = parseInt(dateParts[0]);
    this.month = parseInt(dateParts[1]);
    this.day = dateParts[2] ? parseInt(dateParts[2]) : null;
    this.dateString = `${this.year}-${this.month}-${this.day}`;
    this.calendar = Store.getState().pray.calendar;
    this.s = Store.getState().schedule;
    let {date, ...dayData} = this.calendar.find(item => item.date === this.dateString);
    this.selectedDayData = dayData;
    this.dateObject = new Date(this.dateString);

    let givenMomentNames = Object.keys(this.selectedDayData);
    let givenMoments = this.s.moments.filter(moment => givenMomentNames.includes(moment.slug));

    return html`<div class="inner">
      ${givenMoments.map(moment => {
        let categoryNames = Object.keys(this.selectedDayData[moment.slug]);
        let givenCategories = moment.prayerCategories.filter(category => categoryNames.includes(category.slug)).sort((a, b) => a.order - b.order);
        let prayerScheduler = new PrayerScheduler();
        let prayers = givenCategories.map(category => {
          return category.isFreeForm ? prayerScheduler.getFreeFormPrayer(this.dateObject, category, moment.slug) : prayerScheduler.getFixedPrayer(this.dateObject, category, moment.slug);
        });

        return html`
        <div class="moment" style="${`--color-primary: ${moment.color};  --color-secondary: ${moment.colorBackground}`}">
          <h3 class="moment-title">${moment.name}</h3>
          <ul class="prayer-list">
          ${prayers.map(prayer => {
            return html`
              <li class="prayer-teaser" data-id="${prayer.UniqueID}">
                <a href="${`/prayer/${prayer.category.slug}/${prayer.UniqueID ? prayer.UniqueID : prayer.items.map(item => item.slug).join(',')}?back=${location.pathname}`}">${prayer.category.isFreeForm ? prayer.category.name : prayer.Title}</a>
              </li>`          
          })}
          </ul>
        </div>`
    })}
    </div>`
  }

});