import {Store} from '../Core/Store.js';

export const toggleMoment = (momentSlug) => {
  Store.dispatch({
    type: 'moment-toggle',
    payload: {
      momentSlug: momentSlug
    }
  })
};

export const setMomentTime = (momentSlug, from, till) => {
  Store.dispatch({
    type: 'set-moment-time',
    payload: {
      momentSlug: momentSlug,
      from: from,
      till: till
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

export const deleteFreeCategory = (momentSlug, categorySlug) => {
  Store.dispatch({
    type: 'delete-category',
    payload: {
      momentSlug: momentSlug,
      categorySlug: categorySlug
    }
  })
};

export const addPrayerPoint = (momentSlug, categorySlug, prayerPoint, description) => {
  Store.dispatch({
    type: 'add-prayer-point',
    payload: {
      momentSlug: momentSlug,
      categorySlug: categorySlug,
      prayerPoint: prayerPoint,
      description: description
    }
  })
};

export const updatePrayerPoint = (categorySlug, prayerPointSlug, title, description) => {
  Store.dispatch({
    type: 'update-prayer-point',
    payload: {
      categorySlug: categorySlug,
      prayerPointSlug: prayerPointSlug,
      title: title,
      description: description
    }
  })
};

export const deletePrayerPoint = (momentSlug, categorySlug, prayerPointSlug) => {
  Store.dispatch({
    type: 'delete-prayer-point',
    payload: {
      momentSlug: momentSlug,
      categorySlug: categorySlug,
      prayerPointSlug: prayerPointSlug
    }
  })
};

export const setPrayerPointsOrder = (momentSlug, categorySlug, order) => {
  Store.dispatch({
    type: 'set-prayer-points-order',
    payload: {
      momentSlug: momentSlug,
      categorySlug: categorySlug,
      order: order
    }
  })
};