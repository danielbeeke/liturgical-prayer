import {produce} from "../vendor/immer.js";
import {Slugify} from '../Helpers/Slugify.js';
let moments = prayerData['Moments'];

let initialCategories = prayerData['Categories'].map((category, index) => {
  let allowedMoments = [];

  moments.forEach(moment => {
    if (category[moment.Title]) allowedMoments.push(moment.Title);
  });

  return {
    enabled: true,
    moments: allowedMoments,
    order: index,
    isFreeForm: false,
    name: category.Title,
    slug: Slugify(category.Title),
    description: category.Description,
  }
});

let isEnabledFor = (momentName) => {
  return (category) => category.moments.includes(momentName)
};

let initialState = {
  moments: []
};

moments.forEach(moment => {
  initialState.moments.push({
    name: moment.Title,
    slug: Slugify(moment.Title),
    prayerCategories: initialCategories.filter(isEnabledFor(moment.Title)),
    enabled: moment.Enabled
  })
});


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