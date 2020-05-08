import {BaseElement} from '../Core/BaseElement.js';
import {Store} from '../Core/Store.js';
import {html} from '../vendor/uhtml.js';
import {PrayerScheduler} from '../Helpers/PrayerScheduler.js'
import {markFixedPrayer, markFreePrayer} from '../Actions/PrayActions.js';
import {toLines} from '../Helpers/toLines.js';

customElements.define('prayer-pray', class PrayerPray extends BaseElement {

  draw () {
    let date = new Date();
    let s = Store.getState().schedule;
    let moment = s.moments.find(moment => moment.slug === this.route.parameters.moment);
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
      <a class="menu-item" href="/pray">
        <prayer-icon name="cross" />
      </a>

      <h2 class="page-title">${t.direct(moment.name)}</h2>
      
      ${prayers.map(prayer => html`
        <div class="prayer" data-id="${prayer.UniqueID}">
          <small class="category">${prayer.category.name}</small>
          ${prayer.Author ? html`<em class="author">${prayer.Author}</em>` : html`<span></span>`}
          ${!prayer.category.isFreeForm ? html`
              <h2 class="title">${prayer.Title}</h2>
          ` : html``}
          ${prayer.category.isFreeForm ? html`
              <p class="content">${prayer.Content}</p>
          ` : html`
              <p class="content">${toLines(prayer.Content).map(line => html`${line}<br />`)}</p>
              <span class="amen">Amen</span>  
          `}          
        </div>
      `)}
    `;
    }
});