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
      <a class="close-prayers" href="/pray">
        <prayer-icon name="cross" />
      </a>

      <span class="moment">${t.direct(moment.name)}</span>
      <div class="indicator">
          ${prayers.map((prayer, index) => html`<div class="${'indicator-item' + (index === 0 ? ' active' : '')}"></div>`)}
      </div>


      <div class="slider">
      ${prayers.map((prayer, index) => html`
        <div class="prayer" data-id="${prayer.UniqueID}">
          <div class="header">
            <small class="category">${prayer.category.isFreeForm ? t.direct('Your category') : prayer.category.name}</small>
            ${prayer.Author ? html`<em class="author">${prayer.Author}</em>` : html`<span></span>`}
            <h2 class="title">${prayer.category.isFreeForm ? prayer.category.name : prayer.Title}</h2>
          </div>
          <div class="inner">
            ${prayer.category.isFreeForm ? html`
                <p class="content">${prayer.Content}</p>
            ` : html`
                <p class="content">${toLines(prayer.Content)}</p>
                <span class="amen">Amen</span>  
            `}                  
          </div>
        </div>
      `)}
      </div>
    `;
    }

    afterDraw() {
      let indicators = this.querySelectorAll('.indicator-item');
      let prayers = this.querySelectorAll('.prayer');

      let options = {
        root: this.querySelector('.slider'),
        rootMargin: '30px',
        threshold: .8
      };

      let observer = new IntersectionObserver((entries, observer) => {
        let active = [];
        entries.forEach(entry => {
          if (entry.isIntersecting) active.push(entry.target);
        });

        let activeIndex = [...prayers].indexOf(active[0]);
        indicators.forEach((indicator, index) => indicator.classList[index === activeIndex ? 'add' : 'remove']('active'));
      }, options);

      prayers.forEach(prayer => {
        observer.observe(prayer);
      });

    }
});