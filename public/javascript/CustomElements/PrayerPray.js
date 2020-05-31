import {BaseElement} from '../Core/BaseElement.js';
import {Store} from '../Core/Store.js';
import {html} from '../vendor/uhtml.js';
import {PrayerScheduler} from '../Helpers/PrayerScheduler.js'
import {markFixedPrayer, markFreePrayer} from '../Actions/PrayActions.js';
import {toLines} from '../Helpers/toLines.js';
import {observeCurrentPrayer} from '../Helpers/observeCurrentPrayer.js';

export class PrayerPray extends BaseElement {

  draw () {
    let date = this.getAttribute('date') ? new Date(this.getAttribute('date')) : new Date();
    let s = Store.getState().schedule;

    let moment = s.moments.find(moment => moment.slug === this.route.parameters.moment);
    let p = Store.getState().pray;
    let t = this.root.t;
    this.setAttribute('style', `--color-primary: ${moment.color}; --color-secondary: ${moment.colorBackground}`);

    let activeCategories = moment.prayerCategories.filter(category => category.enabled).sort((a, b) => a.order - b.order);
    let prayerScheduler = new PrayerScheduler();
    let prayers = activeCategories.map(category => {
      return category.isFreeForm ? prayerScheduler.getFreeFormPrayer(date, category, moment.slug) : prayerScheduler.getFixedPrayer(date, category, moment.slug);
    });

    this.prayers = prayers;

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
            ${prayers.map((prayer, index) => html`<div class="indicator-item"></div>`)}
        </div>
        ` : ''}
      </div>

      <div class="slider">
      ${prayers.map((prayer, index) => {
        let category = prayer.category.isFreeForm ? t.direct('Your category') : (prayer.category.name !== prayer.Title ? prayer.category.name : '');

        let prayerIdentifier = prayer.UniqueID ? prayer.UniqueID : prayer.items.map(item => item.slug).join(',');
        let addNoteLink = `/note/${this.route.parameters.moment}/${prayer.category.slug}/${dateString}/${prayerIdentifier}?back=/pray/${this.route.parameters.moment}/${prayer.category.slug}`;

        let currentDateObject = p.calendar.find(item => item.date === dateString);
        let noteExists = currentDateObject.notes[this.route.parameters.moment] && currentDateObject.notes[this.route.parameters.moment][prayer.category.slug];
        let note = noteExists ? currentDateObject.notes[this.route.parameters.moment][prayer.category.slug] : false;
        
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
            
            ${note ? html`
              <div class="note">
              <a class="note-button edit" href="${addNoteLink}">
                <prayer-icon name="pencil" />
              </a>
              <em>${t.direct('Your note:')}</em><br><br>
              ${note.note}
              </div>
            ` : html`
              <a class="note-button" href="${addNoteLink}">
                <prayer-icon name="note-add" />
              </a>
            `}
                                      
          </div>
        </div>`      
      })}
      
      </div>
    `;
  }

  afterDraw() {
    super.afterDraw();
    this.observer = observeCurrentPrayer(this);
    if (!this.route.parameters.category) {
      let url = `/pray/${this.route.parameters.moment}/${this.prayers[0].category.slug}`;
      setTimeout(() => {
        this.root.router.navigate(url);
      });
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.observer.disconnect()
  }

}