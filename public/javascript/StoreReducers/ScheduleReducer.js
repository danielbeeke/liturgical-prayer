import {produce} from "../vendor/immer.js";

/**
 * Holds information about the schedule, is a Redux reducer
 */
export function ScheduleReducer (state = {
  moments: [
    { name: 'Morning', prayerCategories: [{ name: 'The psalms and Hymns', enabled: true, order: 0 }], enabled: true, time: '07:00'},
    { name: 'Afternoon', prayerCategories: [{ name: 'The psalms and Hymns', enabled: true, order: 0 }], enabled: false, time: '14:00' },
    { name: 'Evening', prayerCategories: [{ name: 'The psalms and Hymns', enabled: true, order: 0 }], enabled: true, time: '21:00' },
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

    if (action.type === 'category-toggle') {
      let moment = nextState.moments.find(moment => moment.name === action.payload.momentName);
      let existingCategory = moment.prayerCategories.find(category => category.name === action.payload.categoryName);

      if (existingCategory) {
        existingCategory.enabled = !existingCategory.enabled;
      }
      else {
        moment.prayerCategories.push({
          name: action.payload.categoryName,
          enabled: true,
          order: moment.prayerCategories.length
        })
      }
    }

    if (action.type === 'set-category-order') {
      let moment = nextState.moments.find(moment => moment.name === action.payload.momentName);
      for (let [categoryName, order] of Object.entries(action.payload.order)) {
        let category = moment.prayerCategories.find(category => category.name === categoryName);
        category.order = order;
      }
    }

  });
}