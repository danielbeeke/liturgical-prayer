import {Store} from '../Core/Store.js';

export const navigate = (path) => {
  Store.dispatch({
    type: 'navigate',
    payload: {
      path: path
    }
  })
};

export const setLanguage = (language) => {
  Store.dispatch({
    type: 'set-language',
    payload: {
      language: language
    }
  })
};