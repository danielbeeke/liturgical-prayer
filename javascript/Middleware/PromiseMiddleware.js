import {isPromise} from '../Helpers/IsPromise.js';

/**
 * Resolves promises in the middleware chain.
 */
export function promiseMiddleware({ dispatch }) {
  return next => action => {
    return isPromise(action.payload) && typeof action.promiseResult === 'undefined'
      ? action.payload
        .then(result => dispatch({ ...action, payload: result, success: true }))
        .catch(error => {
          dispatch({ ...action, payload: error, error: true });
          return Promise.reject(error);
        })
      : next(action);
  };
}