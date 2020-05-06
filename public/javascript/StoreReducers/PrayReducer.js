import {produce} from "../vendor/immer.js";
import {Content} from '../Content.js';

/**
 * Holds information about the schedule, is a Redux reducer
 */
export function PrayReducer (state = {
  usedPrayers: [],
  calendar: {}
}, action) {
  return produce(state, nextState => {

    let setCurrentMomentCategoryContent = (content) => {
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
      nextState.calendar[year][month][day][momentSlug][categorySlug] = content;
    };

    if (action.type === 'mark-fixed-prayer') {
      nextState.usedPrayers.push(action.payload.prayerId);
      setCurrentMomentCategoryContent(action.payload.prayerId);
    }

    if (action.type === 'clear-fixed-prayer-category') {
      let allPrayersIds = Content[action.payload.categoryName].map(prayer => prayer.UniqueID);
      nextState.usedPrayers = nextState.usedPrayers.filter(prayer => !allPrayersIds.includes(prayer));
    }

    if (action.type === 'mark-free-prayer') {
      setCurrentMomentCategoryContent(action.payload.items);
    }

  });
}