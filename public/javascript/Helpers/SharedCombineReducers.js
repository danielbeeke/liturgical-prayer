import {assertReducerShape, warning, getUnexpectedStateShapeWarningMessage, getUndefinedStateErrorMessage} from "../vendor/Redux.js";

/**
 * A copy of combineReducers where the whole state is given as a third parameter to the reducers.
 * @param reducers
 * @returns {function(*=, *=): {}}
 */
export function sharedCombineReducers(reducers) {
  let reducerKeys = Object.keys(reducers);
  let finalReducers = {};

  for (let i = 0; i < reducerKeys.length; i++) {
    let key = reducerKeys[i];
    {
      if (typeof reducers[key] === 'undefined') {
        warning("No reducer provided for key \"" + key + "\"");
      }
    }

    if (typeof reducers[key] === 'function') {
      finalReducers[key] = reducers[key];
    }
  }

  let finalReducerKeys = Object.keys(finalReducers); // This is used to make sure we don't warn about the same
  // keys multiple times.
  let unexpectedKeyCache;

  {
    unexpectedKeyCache = {};
  }

  let shapeAssertionError;

  try {
    assertReducerShape(finalReducers);
  } catch (e) {
    shapeAssertionError = e;
  }

  return function combination(state, action) {
    if (state === void 0) {
      state = {};
    }

    if (shapeAssertionError) {
      throw shapeAssertionError;
    }

    {
      let warningMessage = getUnexpectedStateShapeWarningMessage(state, finalReducers, action, unexpectedKeyCache);

      if (warningMessage) {
        warning(warningMessage);
      }
    }

    let hasChanged = false;
    let nextState = {};

    for (let _i = 0; _i < finalReducerKeys.length; _i++) {
      let _key = finalReducerKeys[_i];
      let reducer = finalReducers[_key];
      let previousStateForKey = state[_key];
      let nextStateForKey = reducer(previousStateForKey, action, state, nextState);

      if (typeof nextStateForKey === 'undefined') {
        let errorMessage = getUndefinedStateErrorMessage(_key, action);
        throw new Error(errorMessage);
      }

      nextState[_key] = nextStateForKey;
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    }

    return hasChanged ? nextState : state;
  };
}