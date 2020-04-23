import {Store} from '../Core/Store.js';

export const navigate = (path) => {
  Store.dispatch({
    type: 'navigate',
    payload: {
      path: path
    }
  })
};
