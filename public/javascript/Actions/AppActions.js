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

export const setBible = (bible) => {
  Store.dispatch({
    type: 'set-bible',
    payload: {
      bible: bible
    }
  })
};

export const toggleGrid = () => {
  Store.dispatch({
    type: 'toggle-grid'
  })
};

export const replaceState = (state) => {
  Store.dispatch({
    type: 'replace-state',
    payload: {
      state: state
    }
  })
};