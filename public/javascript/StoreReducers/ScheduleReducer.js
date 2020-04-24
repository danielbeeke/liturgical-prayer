import {produce} from "../vendor/immer.js";

/**
 * Holds information about the schedule, is a Redux reducer
 */
export function ScheduleReducer (state = {
  moments: [
    { name: 'Morning', prayerCategories: [], enabled: true, time: '07:00'},
    { name: 'Afternoon', prayerCategories: [], enabled: false, time: '14:00' },
    { name: 'Evening', prayerCategories: [], enabled: true, time: '21:00' },
  ],
  prayerCategories: [
    { name: 'The psalms and Hymns' },
    { name: 'The early church fathers' },
    { name: 'the Lord\'s Prayer' },
  ],
  freeCategoriesSuggestions: [
    { name: 'Friends' },
    { name: 'My church' },
    { name: 'The city' },
    { name: 'Family' },
  ]
}, action) {
  return produce(state, nextState => {

    if (action.type === 'moment-toggle') {
      let moment = nextState.moments.find(moment => moment.name === action.payload.momentName);
      moment.enabled = !moment.enabled;
    }

    if (action.type === 'set-moment-time') {
      let moment = nextState.moments.find(moment => moment.name === action.payload.momentName);
      moment.time = action.payload.time;
    }

  });
}