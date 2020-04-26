import {Store} from '../Core/Store.js';

export const markPrayer = (date, momentSlug, categorySlug, prayerId) => {
  Store.dispatch({
    type: 'mark-prayer',
    payload: {
      prayerId: prayerId,
      momentSlug: momentSlug,
      categorySlug: categorySlug,
      date: date
    }
  })
};

export const clearPrayerCategory = (categorySlug) => {
  Store.dispatch({
    type: 'clear-prayer-category',
    payload: {
      categorySlug: categorySlug,
    }
  })
};
