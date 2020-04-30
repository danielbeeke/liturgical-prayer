import {Store} from '../Core/Store.js';

export const markFreePrayer = (date, momentSlug, categorySlug, items) => {
  Store.dispatch({
    type: 'mark-free-prayer',
    payload: {
      items: items,
      momentSlug: momentSlug,
      categorySlug: categorySlug,
      date: date
    }
  })
};

export const markFixedPrayer = (date, momentSlug, categorySlug, prayerId) => {
  Store.dispatch({
    type: 'mark-fixed-prayer',
    payload: {
      prayerId: prayerId,
      momentSlug: momentSlug,
      categorySlug: categorySlug,
      date: date
    }
  })
};

export const clearFixedPrayerCategory = (categoryName) => {
  Store.dispatch({
    type: 'clear-fixed-prayer-category',
    payload: {
      categoryName: categoryName,
    }
  })
};
