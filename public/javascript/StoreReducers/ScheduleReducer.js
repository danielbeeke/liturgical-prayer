import {produce} from "../vendor/immer.js";
import {Slugify} from '../Helpers/Slugify.js';
import {Content} from '../Content.js';

let moments = Content['Moments'];

let initialCategories = Content['Categories'].map((category, index) => {
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
    icon: category.Icon,
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
    color: moment.Color,
    background: moment.Background,
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
    let freeCategory = action?.payload?.categorySlug && nextState.freeCategories.find(category => category.slug === action.payload.categorySlug);

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
      nextState.freeCategories.push({
        name: action.payload.category.name,
        slug: action.payload.category.slug,
        items: action.payload.category.items
      });

      let {items, ...slimCategory} = action.payload.category;

      /**
       * Add the category to all the moments
       */
      nextState.moments.forEach(innerMoment => {
        innerMoment.prayerCategories.push(Object.assign({}, slimCategory, { enabled: innerMoment.slug === moment.slug}));
      });
    }

    if (action.type === 'delete-category') {
      /**
       * Remove the category from all the moments
       */
      nextState.moments.forEach(moment => {
        let category = action?.payload?.categorySlug && moment.prayerCategories.find(category => category.slug === action.payload.categorySlug);
        let existingCategoryIndex = moment.prayerCategories.indexOf(category);
        moment.prayerCategories.splice(existingCategoryIndex, 1);
      });

      /**
       * Remove it from the free categories.
       */
      let foundCategory = nextState.freeCategories.find(freeCategory => freeCategory.slug === category.slug);
      let existingFreeCategoryIndex = nextState.freeCategories.indexOf(foundCategory);
      nextState.freeCategories.splice(existingFreeCategoryIndex, 1);
    }

    if (action.type === 'add-prayer-point') {
      freeCategory.items.push(action.payload.prayerPoint);
    }

    if (action.type === 'delete-prayer-point') {
      freeCategory.items = freeCategory.items.filter(item => item !== action.payload.prayerPoint);
    }

    if (action.type === 'set-prayer-points-order') {
      freeCategory.items = action.payload.prayerPoints;
    }

  });
}