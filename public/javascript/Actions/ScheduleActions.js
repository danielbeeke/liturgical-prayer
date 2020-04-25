import {Store} from '../Core/Store.js';

export const toggleMoment = (momentSlug) => {
  Store.dispatch({
    type: 'moment-toggle',
    payload: {
      momentSlug: momentSlug
    }
  })
};

export const setMomentTime = (momentSlug, time) => {
  Store.dispatch({
    type: 'set-moment-time',
    payload: {
      momentSlug: momentSlug,
      time: time
    }
  })
};

export const toggleCategory = (momentSlug, categorySlug) => {
  Store.dispatch({
    type: 'category-toggle',
    payload: {
      momentSlug: momentSlug,
      categorySlug: categorySlug
    }
  })
};

export const setCategoriesOrder = (momentSlug, order) => {
  Store.dispatch({
    type: 'set-category-order',
    payload: {
      momentSlug: momentSlug,
      order: order
    }
  })
};

export const createFreeCategory = (momentSlug, category) => {
  Store.dispatch({
    type: 'create-category',
    payload: {
      momentSlug: momentSlug,
      category: category
    }
  })
};