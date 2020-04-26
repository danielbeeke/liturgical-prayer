import {BaseElement} from '../Core/BaseElement.js';
import {Store} from '../Core/Store.js';
import {html} from '../vendor/lighterhtml.js';
import {PrayerScheduler} from '../Helpers/PrayerScheduler.js'
import {markPrayer} from '../Actions/PrayActions.js';

customElements.define('prayer-pray', class PrayerPray extends BaseElement {

  draw () {
    let date = new Date();
    let s = Store.getState().schedule;
    let slug = this.root.router.part(2);
    let moment = s.moments.find(moment => moment.slug === slug);
    let t = this.root.t;

    let activeCategories = moment.prayerCategories.filter(category => category.enabled && !category.isFreeForm);
    let prayerScheduler = new PrayerScheduler();
    let prayers = activeCategories.map(category => prayerScheduler.getPrayer(date, category, moment.slug));

    prayers.forEach(prayer => {
      if (!prayer.marked) {
        markPrayer(date.toDateString(), moment.slug, prayer.category.slug, prayer.UniqueID);
      }
    });

    return html`
        <a href="/pray">Home</a>
        <h1>${t.direct(moment.name)}</h1>
        
        ${prayers.map(prayer => html`
          <div class="prayer" data-id="${prayer.UniqueID}">
            <small>${prayer.category.name}</small>
            <h2>${prayer.Title}</h2>
            <div class="author">${prayer.Content}</div>            
            <em class="author">${prayer.Author}</em>
          </div>
        `)}
        
    `;
  }
});