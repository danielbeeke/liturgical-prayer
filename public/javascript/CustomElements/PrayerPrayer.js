import {BaseElement} from '../Core/BaseElement.js';
import {html} from 'https://cdn.skypack.dev/uhtml/async'
import {Content} from '../Content.js';
import {toLines} from '../Helpers/toLines.js';
import {Slugify} from '../Helpers/Slugify.js';
import {Store} from '../Core/Store.js';
import {prepareAuthors} from '../Helpers/prepareAuthors.js';

export class PrayerPrayer extends BaseElement {

  draw () {
    let query = (new URL(document.location)).searchParams;

    return html`
      ${query.get('back') ? html`
        <a class="close-prayers" href="${query.get('back')}">
          <prayer-icon name="cross" />
        </a>
      ` : ''}
      
      ${this.getPrayer()}  
    `;
  }

  getPrayer () {
    let t = this.root.t;
    let prayer;
    let fixedCategory = Content['Categories'].find(category => {
      return category.id === this.route.parameters.category;
    });

    if (fixedCategory && fixedCategory.Title) {
      let prayerPage = Content[fixedCategory.Title];
      prayer = prayerPage.find(prayer => prayer.UniqueID === this.route.parameters.prayer);
      prayer.category = fixedCategory;
    }

    if (!fixedCategory) {
      let freeCategories = Store.getState().schedule.freeCategories;
      let freeCategoryOriginal = freeCategories.find(freeCategory => freeCategory.slug === this.route.parameters.category);
      let freeCategory = Object.assign({ isFreeForm: true }, freeCategoryOriginal);

      prayer = {
        Title: freeCategory.name,
        name: freeCategory.name,
        items: freeCategory.items,
        marked: true,
        category: freeCategory,
      };
    }

    let category = prayer.category.isFreeForm ? t.direct('Your category') : (prayer.category.Title !== prayer.Title ? prayer.category.Title : '');

    if (prayer) {
      return html`<div class="prayer" data-id="${prayer.UniqueID}">
        <div class="header">
          <h2 class="title">${prayer.category.isFreeForm ? prayer.category.name : prayer.Title}</h2>
          <div class="meta">
            ${category ? html`<small class="category"><prayer-icon name="tag" />${category}</small>` : html``}
            ${prayer.Author ? prepareAuthors(prayer.Author) : html``}            
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
        </div>
      </div>`;
    }
  }
}