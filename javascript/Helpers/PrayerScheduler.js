import {Store} from '../Core/Store.js';
import {clearPrayerCategory} from '../Actions/PrayActions.js';

export class PrayerScheduler {

  // First try to see if this moment and day combination has already been assigned prayers.
  // If not gather new ones.
  getPrayer (date, prayerCategory, momentSlug) {
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
      return this.getNextPrayer(prayerCategory);
    }
  }

  /**
   * This also clears the state if all prayers of one category has been used.
   * @param prayerCategory
   * @returns {any}
   */
  getNextPrayer (prayerCategory) {
    this.p = Store.getState().pray;
    let allPrayers = prayerData[prayerCategory.name];
    let unusedPrayers = allPrayers.filter(prayer => !this.p.usedPrayers.includes(prayer.UniqueID));

    if (!unusedPrayers.length) {
      clearPrayerCategory(prayerCategory.name);
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