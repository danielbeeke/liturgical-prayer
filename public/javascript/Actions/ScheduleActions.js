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