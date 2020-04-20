import {produce} from "../vendor/immer.js";

/**
 * Holds information about the user, is a Redux reducer
 */
export function PrayerScheduleReducer (state = {
  granularity: 30
}, action) {
  return produce(state, nextState => {
    if (action.type === 'set-schedule-granularity') nextState.granularity = action.payload.granularity;

  });
}