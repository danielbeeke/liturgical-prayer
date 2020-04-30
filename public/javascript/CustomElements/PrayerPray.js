import {BaseElement} from '../Core/BaseElement.js';
import {Store} from '../Core/Store.js';
import {html} from '../vendor/lighterhtml.js';
import {PrayerScheduler} from '../Helpers/PrayerScheduler.js'
import {markFixedPrayer, markFreePrayer} from '../Actions/PrayActions.js';

customElements.define('prayer-pray', class PrayerPray extends BaseElement {

  draw () {
    let date = new Date();
    let s = Store.getState().schedule;
    let slug = this.root.router.part(2);
    let moment = s.moments.find(moment => moment.slug === slug);
    let t = this.root.t;

    let activeCategories = moment.prayerCategories.filter(category => category.enabled).sort((a, b) => a.order - b.order);
    let prayerScheduler = new PrayerScheduler();
    let prayers = activeCategories.map(category => {
      return category.isFreeForm ? prayerScheduler.getFreeFormPrayer(date, category, moment.slug) : prayerScheduler.getFixedPrayer(date, category, moment.slug);
    });

    prayers.forEach(prayer => {
      if (!prayer.marked) {
        if (prayer.category.isFreeForm) {
          markFreePrayer(date.toDateString(), moment.slug, prayer.category.slug, prayer.items);
        }
        else {
          markFixedPrayer(date.toDateString(), moment.slug, prayer.category.slug, prayer.UniqueID);
        }
      }
    });

    return html`
        <h2>${t.direct(moment.name)}</h2>
        
        ${prayers.map(prayer => html`
          <div class="prayer" data-id="${prayer.UniqueID}">
            <small>${prayer.category.name}</small>
            ${!prayer.category.isFreeForm ? html`
                <h2>${prayer.Title}</h2>
            ` : html``}
            <div class="author">${prayer.Content}</div>            
            <em class="author">${prayer.Author}</em>
          </div>
        `)}
        
        <prayer-menu />
    `;
  }
});