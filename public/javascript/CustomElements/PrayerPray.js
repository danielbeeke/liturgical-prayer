import {BaseElement} from '../Core/BaseElement.js';
import {Store} from '../Core/Store.js';
import {html} from '../vendor/uhtml.js';
import {PrayerScheduler} from '../Helpers/PrayerScheduler.js'
import {markFixedPrayer, markFreePrayer} from '../Actions/PrayActions.js';
import {toLines} from '../Helpers/toLines.js';
import {observeCurrentPrayer} from '../Helpers/observeCurrentPrayer.js';

customElements.define('prayer-pray', class PrayerPray extends BaseElement {

  constructor() {
    super();
    this.showNotePanel = false;
  }

  draw () {
    let date = this.getAttribute('date') ? new Date(this.getAttribute('date')) : new Date();
    let s = Store.getState().schedule;

    let moment = s.moments.find(moment => moment.slug === this.route.parameters.moment);

    let t = this.root.t;
    this.setAttribute('style', `--color-primary: ${moment.color}; --color-secondary: ${moment.colorBackground}`);

    let activeCategories = moment.prayerCategories.filter(category => category.enabled).sort((a, b) => a.order - b.order);
    let prayerScheduler = new PrayerScheduler();
    let prayers = activeCategories.map(category => {
      return category.isFreeForm ? prayerScheduler.getFreeFormPrayer(date, category, moment.slug) : prayerScheduler.getFixedPrayer(date, category, moment.slug);
    });

    prayers.forEach(prayer => {
      if (!prayer.marked) {
        if (prayer.category.isFreeForm) {
          markFreePrayer(date.toDateString(), moment.slug, prayer.category.slug, prayer.items.map(item => item.slug));
        }
        else {
          markFixedPrayer(date.toDateString(), moment.slug, prayer.category.slug, prayer.UniqueID);
        }
      }
    });

    let now = new Date();
    let dateString = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

    return html`
      <a class="close-prayers" href="/pray">
        <prayer-icon name="cross" />
      </a>
      
      <div class="pre-header">
        <span class="moment">${t.direct(moment.name)}</span>
        ${prayers.length > 1 ? html`
        <div class="indicator">
            ${prayers.map((prayer, index) => html`<div class="${'indicator-item' + (index === 0 ? ' active' : '')}"></div>`)}
        </div>
        ` : ''}
      </div>

      <div class="slider">
      ${prayers.map((prayer, index) => {
        let category = prayer.category.isFreeForm ? t.direct('Your category') : (prayer.category.name !== prayer.Title ? prayer.category.name : '');
              
        return html`<div class="prayer" data-id="${prayer.UniqueID}">
          <div class="header">
            <h2 class="title">${prayer.category.isFreeForm ? prayer.category.name : prayer.Title}</h2>
            <div class="meta">
              ${category ? html`<small class="category"><prayer-icon name="tag" />${category}</small>` : html`` }
              ${prayer.Author ? html`<em class="author"><prayer-icon name="author" />${prayer.Author}</em>` : html``}            
            </div>
          </div>
          <div class="inner">
            <p class="content">${prayer.category.isFreeForm ? 
              prayer.items.map(item => html`
                <span class="prayer-item">${item.title}</span>
                ${item.description ? html`<em class="description">${item.description}</em>` : ''}
              `) : 
              toLines(this.tokenize(prayer.Content))}
            </p>
            <span class="amen">Amen</span>
            
            <prayer-add-note 
                moment="${this.route.parameters.moment}" 
                category="${prayer.category.slug}" 
                date="${dateString}"
                prayer="${prayer.UniqueID ? prayer.UniqueID : prayer.items.map(item => item.slug).join(',')}" />
              
          </div>
        </div>`      
      })}
      
      </div>
    `;
  }

  afterDraw() {
    observeCurrentPrayer(this);
  }

});