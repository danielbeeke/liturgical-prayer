import {Store} from '../Core/Store.js';
import {clearFixedPrayerCategory} from '../Actions/PrayActions.js';
import {html} from '../vendor/lighterhtml.js';

export class PrayerScheduler {

  /**
   * Returns a couple of items from the list.
   * @param date
   * @param prayerCategory
   * @param momentSlug
   * @returns {{marked: boolean, Content: Hole, Title: *, category: *}}
   */
  getFreeFormPrayer (date, prayerCategory, momentSlug) {
    this.p = Store.getState().pray;
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let assignedItems = this.p.calendar?.[year]?.[month]?.[day]?.[momentSlug]?.[prayerCategory.slug];

    if (assignedItems) {
      return {
        Title: prayerCategory.name,
        Content: html`
        <ul>
          ${assignedItems.map(item => html`
            <li>${item}</li>
          `)}
        </ul>
      `,
        items: assignedItems,
        marked: true,
        category: prayerCategory,
      }
    }
    else {
      return this.getNextFreePrayer(date, prayerCategory);
    }
  }

  /**
   * Populates the next items of the free prayer category to pray for.
   * @param date
   * @param prayerCategory
   * @returns {{marked: boolean, Content: Hole, Title: *, category: *, items: *[]}}
   */
  getNextFreePrayer (date, prayerCategory) {
    this.p = Store.getState().pray;
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let currentMonthItems = this.p.calendar?.[year]?.[month] ?? [];

    let previousYear = month === 1 ? year - 1 : year;
    let previousMonth = month === 1 ? 12 : month - 1;
    let previousMonthItems = this.p.calendar?.[previousYear]?.[previousMonth] ?? [];

    let chunks = [];

    let addToChunks = (items) => {
      for (let [day] of Object.entries(items)) {
        for (let [categories] of Object.entries(day)) {
          for (let [categoryContent] of Object.entries(categories)) {
            if (Array.isArray(categoryContent)) {
              chunks.push(categoryContent);
            }
          }
        }
      }
    };

    addToChunks(currentMonthItems);
    addToChunks(previousMonthItems);

    let max = Math.ceil(prayerCategory.items.length / 7);

    let itemsAllowedByDistanceOfPastUsage = [];

    // Check if the item has been used last 7 days.
    prayerCategory.items.forEach(item => {
      let found = false;
      for (let i = 0; i < 7; i++) {
        if (chunks[i] && chunks[i].includes(item)) {
          found = true;
        }
      }

      if (!found) {
        itemsAllowedByDistanceOfPastUsage.push(item);
      }
    });

    let allowedItems = itemsAllowedByDistanceOfPastUsage.slice(0, max);

    return {
      Title: prayerCategory.name,
      Content: html`
        <ul>
          ${allowedItems.map(item => html`
            <li>${item}</li>
          `)}
        </ul>
      `,
      items: allowedItems,
      marked: false,
      category: prayerCategory,
    };
  }


  /**
   * First try to see if this moment and day combination has already been assigned prayers.
   * If not gather new ones.
   * @param date
   * @param prayerCategory
   * @param momentSlug
   * @returns {any|({} & number & {marked: boolean, category: *})|({} & bigint & {marked: boolean, category: *})|({} & null & {marked: boolean, category: *})|({} & [] & {marked: boolean, category: *})|any}
   */
  getFixedPrayer (date, prayerCategory, momentSlug) {
    this.p = Store.getState().pray;
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let assignedPrayerId = this.p.calendar?.[year]?.[month]?.[day]?.[momentSlug]?.[prayerCategory.slug];

    if (assignedPrayerId) {
      let allPrayers = prayerData[prayerCategory.name];
      let foundPrayer = allPrayers.find(prayer => prayer.UniqueID === assignedPrayerId);

      if (!foundPrayer) {
        throw new Error('Could not find prayer: ' + assignedPrayerId)
      }

      return Object.assign({}, foundPrayer, {
        category: prayerCategory,
        marked: true,
      });
    }
    else {
      return this.getNextFixedPrayer(prayerCategory);
    }
  }

  /**
   * This also clears the state if all prayers of one category has been used.
   * @param prayerCategory
   * @returns {any}
   */
  getNextFixedPrayer (prayerCategory) {
    this.p = Store.getState().pray;
    let allPrayers = prayerData[prayerCategory.name];
    let unusedPrayers = allPrayers.filter(prayer => !this.p.usedPrayers.includes(prayer.UniqueID));

    if (!unusedPrayers.length) {
      clearFixedPrayerCategory(prayerCategory.name);
      return Object.assign({}, allPrayers[0], {
        category: prayerCategory
      });
    }
    else {
      return Object.assign({}, unusedPrayers[0], {
        category: prayerCategory
      });
    }
  }

}