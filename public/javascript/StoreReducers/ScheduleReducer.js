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
  moments: [],
  freeCategories: []
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
    let moment = action?.payload?.momentSlug && nextState.moments.find(moment => moment.slug === action.payload.momentSlug);
    let category = action?.payload?.categorySlug && moment.prayerCategories.find(category => category.slug === action.payload.categorySlug);

    if (action.type === 'moment-toggle') {
      moment.enabled = !moment.enabled;
    }

    if (action.type === 'category-toggle') {
      category.enabled = !category.enabled;
    }

    if (action.type === 'set-category-order') {
      for (let [categorySlug, order] of Object.entries(action.payload.order)) {
        let category = moment.prayerCategories.find(category => category.slug === categorySlug);
        category.order = order;
      }
    }

    if (action.type === 'create-category') {
      moment.prayerCategories.push(action.payload.category)
    }

    if (action.type === 'delete-category') {
      let existingCategoryIndex = moment.prayerCategories.indexOf(category);
      moment.prayerCategories.splice(existingCategoryIndex, 1);
    }

    if (action.type === 'add-prayer-point') {
      category.items.push(action.payload.prayerPoint);
    }

    if (action.type === 'delete-prayer-point') {
      category.items = category.items.filter(item => item !== action.payload.prayerPoint);
    }

    if (action.type === 'set-prayer-points-order') {
      category.items = action.payload.prayerPoints;
    }

  });
}