import {produce} from "../vendor/immer.js";
import {Slugify} from '../Helpers/Slugify.js';

let initialCategories = prayerData['Categories'].map((category, index) => {
  return {
    enabled: true,
    order: index,
    isFreeForm: false,
    name: category.Title,
    slug: Slugify(category.Title),
    description: category.Description,
  }
});

let initialState = {
  moments: [
    { name: 'Morning', slug: 'morning', prayerCategories: [...initialCategories], enabled: true},
    { name: 'Afternoon', slug: 'afternoon', prayerCategories: [...initialCategories], enabled: false },
    { name: 'Evening', slug: 'evening', prayerCategories: [...initialCategories], enabled: true },
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

    if (action.type === 'create-category') {
      let moment = nextState.moments.find(moment => moment.slug === action.payload.momentSlug);
      moment.prayerCategories.push(action.payload.category)
    }

    if (action.type === 'delete-category') {
      let moment = nextState.moments.find(moment => moment.slug === action.payload.momentSlug);
      let existingCategory = moment.prayerCategories.find(category => category.slug === action.payload.categorySlug);
      let existingCategoryIndex = moment.prayerCategories.indexOf(existingCategory);
      moment.prayerCategories.splice(existingCategoryIndex, 1);
    }

    if (action.type === 'add-prayer-point') {
      let moment = nextState.moments.find(moment => moment.slug === action.payload.momentSlug);
      let category = moment.prayerCategories.find(category => category.slug === action.payload.categorySlug);
      category.items.push(action.payload.prayerPoint);
    }

    if (action.type === 'delete-prayer-point') {
      let moment = nextState.moments.find(moment => moment.slug === action.payload.momentSlug);
      let category = moment.prayerCategories.find(category => category.slug === action.payload.categorySlug);
      category.items = category.items.filter(item => item !== action.payload.prayerPoint);
    }

    if (action.type === 'set-prayer-points-order') {
      let moment = nextState.moments.find(moment => moment.slug === action.payload.momentSlug);
      let category = moment.prayerCategories.find(category => category.slug === action.payload.categorySlug);
      category.items = action.payload.prayerPoints;
    }

  });
}