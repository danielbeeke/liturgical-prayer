import {Store} from '../Core/Store.js';
import {clearFixedPrayerCategory} from '../Actions/PrayActions.js';
import {Content} from '../Content.js';

export class PrayerScheduler {

  /**
   * Returns a couple of items from the list.
   * @param date
   * @param prayerCategory
   * @param momentSlug
   * @returns {{marked: boolean, Content: Hole, Title: *, category: *}}
   */
  getFreeFormPrayer (date, prayerCategory, momentSlug) {
    this.s = Store.getState().schedule;
    this.p = Store.getState().pray;
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let dateString = `${year}-${month}-${day}`;
    let currentDateObject = this.p.calendar.find(item => item.date === dateString);
    let assignedItemIds = currentDateObject && currentDateObject.moments[momentSlug] && currentDateObject.moments[momentSlug][prayerCategory.slug];

    let freeCategory = this.s.freeCategories.find(freeCategory => freeCategory.slug === prayerCategory.slug);
    let assignedItems = assignedItemIds && assignedItemIds.length ? freeCategory.items.filter(item => assignedItemIds.includes(item.slug)) : [];

    if (assignedItems.length) {
      return {
        Title: prayerCategory.name,
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
    this.s = Store.getState().schedule;

    let previousItems = {};

    let chunks = [];

    let addToChunks = (items) => {
      for (let [day, moments] of Object.entries(items)) {
        for (let [moment, categories] of Object.entries(moments)) {
          for (let [category, Content] of Object.entries(categories)) {
            if (Array.isArray(Content)) {
              chunks.push(Content);
            }
          }
        }
      }
    };

    addToChunks(previousItems);

    let freeCategory = this.s.freeCategories.find(freeCategory => freeCategory.slug === prayerCategory.slug);

    let max = Math.ceil(freeCategory.items.length / 7);

    let itemsAllowedByDistanceOfPastUsage = [];

    // Check if the item has been used last 7 days.
    freeCategory.items.forEach(item => {
      let found = false;
      for (let i = 0; i < 7; i++) {
        if (chunks[i] && chunks[i].includes(item.slug)) {
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

    let dateString = `${year}-${month}-${day}`;
    let currentDateObject = this.p.calendar.find(item => item.date === dateString);
    let assignedPrayerId = currentDateObject ? currentDateObject.moments[momentSlug] && currentDateObject.moments[momentSlug][prayerCategory.slug] : false;

    if (assignedPrayerId) {
      let allPrayers = Content[prayerCategory.name];
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
    if (!Content[prayerCategory.name]) {
      throw new Error(`The category: ${prayerCategory.name} could not be found in the content data.`);
    }

    let allPrayers = Content[prayerCategory.name];
    let unusedPrayers = allPrayers.filter(prayer => !this.p.usedPrayers.includes(prayer.UniqueID));

    if (prayerCategory.shuffle) {
      unusedPrayers = this.shuffle([...unusedPrayers]);
    }

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

  shuffle(array) {
    let currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }

}