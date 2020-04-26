import {produce} from "../vendor/immer.js";

/**
 * Holds information about the schedule, is a Redux reducer
 */
export function PrayReducer (state = {
  usedPrayers: [],
  calendar: {}
}, action) {
  return produce(state, nextState => {

    if (action.type === 'mark-prayer') {
      if (action.payload.prayerId === null ){
        throw new Error('PrayerId can not be null');
      }

      if (!nextState.usedPrayers.includes(action.payload.prayerId)) {
        nextState.usedPrayers.push(action.payload.prayerId);

        let date = new Date(action.payload.date);

        let year = date.getFullYear();
        let month = date.getMonth() + 1;
        let day = date.getDate();
        let momentSlug = action.payload.momentSlug;
        let categorySlug = action.payload.categorySlug;

        if (!nextState.calendar[year]) nextState.calendar[year] = {};
        if (!nextState.calendar[year][month]) nextState.calendar[year][month] = {};
        if (!nextState.calendar[year][month][day]) nextState.calendar[year][month][day] = {};
        if (!nextState.calendar[year][month][day][momentSlug]) nextState.calendar[year][month][day][momentSlug] = {};

        nextState.calendar[year][month][day][momentSlug][categorySlug] = action.payload.prayerId;
      }
      else {
        throw new Error(`Prayer: ${action.payload.prayerId} was already used.`);
      }
    }

    if (action.type === 'clear-prayer-category') {
      let allPrayersIds = prayerData[action.payload.categoryName].map(prayer => prayer.UniqueID);
      nextState.usedPrayers = nextState.usedPrayers.filter(prayer => !allPrayersIds.includes(prayer));
    }

  });
}