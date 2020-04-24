import {Store} from '../Core/Store.js';

export const toggleMoment = (momentName) => {
  Store.dispatch({
    type: 'moment-toggle',
    payload: {
      momentName: momentName
    }
  })
};

export const setMomentTime = (momentName, time) => {
  Store.dispatch({
    type: 'set-moment-time',
    payload: {
      momentName: momentName,
      time: time
    }
  })
};

export const toggleCategory = (momentName, categoryName) => {
  Store.dispatch({
    type: 'category-toggle',
    payload: {
      momentName: momentName,
      categoryName: categoryName
    }
  })
};

export const setCategoriesOrder = (momentName, order) => {
  Store.dispatch({
    type: 'set-category-order',
    payload: {
      momentName: momentName,
      order: order
    }
  })
};