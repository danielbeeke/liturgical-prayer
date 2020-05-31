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

export const saveNote = (momentSlug, dateString, prayer, categorySlug, note) => {
  Store.dispatch({
    type: 'save-note',
    payload: {
      momentSlug: momentSlug,
      dateString: dateString,
      categorySlug: categorySlug,
      prayer: prayer,
      note: note
    }
  })
};

export const deleteNote = (momentSlug, dateString, prayer, categorySlug) => {
  Store.dispatch({
    type: 'delete-note',
    payload: {
      momentSlug: momentSlug,
      dateString: dateString,
      categorySlug: categorySlug,
      prayer: prayer
    }
  })
};