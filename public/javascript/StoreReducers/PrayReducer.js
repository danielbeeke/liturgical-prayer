import {produce} from "../vendor/immer.js";
import {Content} from '../DataLoader.js';

/**
 * Holds information about the schedule, is a Redux reducer
 */
export function PrayReducer (state = {
  usedPrayers: [],
  calendar: []
}, action) {
  return produce(state, nextState => {

    let setCurrentMomentCategoryContent = (content) => {
      let date = new Date(action.payload.date);
      let year = date.getFullYear();
      let month = date.getMonth() + 1;
      let day = date.getDate();
      let momentSlug = action.payload.momentSlug;
      let categorySlug = action.payload.categorySlug;
      let dateString = `${year}-${month}-${day}`;

      let currentDateObject = nextState.calendar.find(item => item.date === dateString);
      if (!currentDateObject) {
        currentDateObject = {
          date: dateString,
          moments: {},
          notes: {},
        };
        nextState.calendar.push(currentDateObject);
      }

      if (!currentDateObject.moments[momentSlug]) {
        currentDateObject.moments[momentSlug] = {};
      }

      currentDateObject.moments[momentSlug][categorySlug] = content;
    };

    if (action.type === 'mark-fixed-prayer') {
      nextState.usedPrayers.push(action.payload.prayerId);
      setCurrentMomentCategoryContent(action.payload.prayerId);
    }

    if (action.type === 'clear-fixed-prayer-category') {
      let categoryPrayersIds = Content[action.payload.categoryName].map(prayer => prayer.UniqueID);
      nextState.usedPrayers = nextState.usedPrayers.filter(prayer => !categoryPrayersIds.includes(prayer));
    }

    if (action.type === 'mark-free-prayer') {
      setCurrentMomentCategoryContent(action.payload.items);
    }

    if (action.type === 'save-note') {
      let currentDateObject = nextState.calendar.find(item => item.date === action.payload.dateString);
      if (!currentDateObject.notes[action.payload.momentSlug]) {
        currentDateObject.notes[action.payload.momentSlug] = {};
      }

      currentDateObject.notes[action.payload.momentSlug][action.payload.categorySlug] = {
        prayer: action.payload.prayer,
        note: action.payload.note
      };
    }

    if (action.type === 'delete-note') {
      let currentDateObject = nextState.calendar.find(item => item.date === action.payload.dateString);
      delete currentDateObject.notes[action.payload.momentSlug][action.payload.categorySlug];
    }

    if (action.type === 'replace-state') {
      for (let [key, value] of Object.entries(action.payload.state.pray)) {
        nextState[key] = value;
      }
    }
  });
}
