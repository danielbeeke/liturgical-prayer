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

export const deleteFreeCategory = (momentSlug, categorySlug) => {
  Store.dispatch({
    type: 'delete-category',
    payload: {
      momentSlug: momentSlug,
      categorySlug: categorySlug
    }
  })
};

export const addPrayerPoint = (momentSlug, categorySlug, prayerPoint) => {
  Store.dispatch({
    type: 'add-prayer-point',
    payload: {
      momentSlug: momentSlug,
      categorySlug: categorySlug,
      prayerPoint: prayerPoint
    }
  })
};

export const deletePrayerPoint = (momentSlug, categorySlug, prayerPoint) => {
  Store.dispatch({
    type: 'delete-prayer-point',
    payload: {
      momentSlug: momentSlug,
      categorySlug: categorySlug,
      prayerPoint: prayerPoint
    }
  })
};

export const setPrayerPointsOrder = (momentSlug, categorySlug, prayerPoints) => {
  Store.dispatch({
    type: 'set-prayer-points-order',
    payload: {
      momentSlug: momentSlug,
      categorySlug: categorySlug,
      prayerPoints: prayerPoints
    }
  })
};