import {produce} from "../vendor/immer.js";
import {Slugify} from '../Helpers/Slugify.js';

let initialCategories = prayerData['Categories'].map((category, index) => {
  return {
    enabled: true,
    order: index,
    name: category.Title,
    slug: Slugify(category.Title),
    description: category.description,
  }
});

let initialState = {
  moments: [
    { name: 'Morning', slug: 'morning', prayerCategories: [...initialCategories], enabled: true, time: '07:00'},
    { name: 'Afternoon', slug: 'afternoon', prayerCategories: [...initialCategories], enabled: false, time: '14:00' },
    { name: 'Evening', slug: 'evening', prayerCategories: [...initialCategories], enabled: true, time: '21:00' },
  ]
};

/**
 * Holds information about the schedule, is a Redux reducer
 */
export function ScheduleReducer (state = initialState, action) {
  return produce(state, nextState => {

    if (action.type === 'moment-toggle') {
      let moment = nextState.moments.find(moment => moment.slug === action.payload.momentSlug);
      moment.enabled = !moment.enabled;
    }

    if (action.type === 'set-moment-time') {
      let moment = nextState.moments.find(moment => moment.slug === action.payload.momentSlug);
      moment.time = action.payload.time;
    }

    if (action.type === 'category-toggle') {
      let moment = nextState.moments.find(moment => moment.slug === action.payload.momentSlug);
      let existingCategory = moment.prayerCategories.find(category => category.slug === action.payload.categorySlug);
      existingCategory.enabled = !existingCategory.enabled;
    }

    if (action.type === 'set-category-order') {
      let moment = nextState.moments.find(moment => moment.slug === action.payload.momentSlug);
      for (let [categorySlug, order] of Object.entries(action.payload.order)) {
        let category = moment.prayerCategories.find(category => category.slug === categorySlug);
        category.order = order;
      }
    }

  });
}