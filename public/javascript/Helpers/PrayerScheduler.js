import {Store} from '../Core/Store.js';


export class PrayerScheduler {

  // First try to see if this moment and day combination has already been assigned prayers.
  // If not gather new ones.
  getPrayer (date, prayerCategory, momentSlug) {
    this.p = Store.getState().pray;
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let assignedPrayerId = this.p.calendar?.[year]?.[month]?.[day]?.[momentSlug];
    let allPrayers = prayerData[prayerCategory.name];
    if (assignedPrayerId) {
      return Object.assign({}, allPrayers.find(prayer => prayer.UniqueID), {
        category: prayerCategory,
        marked: true,
      });
    }
    else {
      return this.getNextPrayer(prayerCategory);
    }
  }

  getNextPrayer (prayerCategory) {
    this.p = Store.getState().pray;
    let allPrayers = prayerData[prayerCategory.name];
    let unusedPrayers = allPrayers.filter(prayer => !this.p.usedPrayers.includes(prayer.UniqueID));

    if (!unusedPrayers) {

    }

    return Object.assign({}, unusedPrayers[0], {
      category: prayerCategory
    });
  }

}