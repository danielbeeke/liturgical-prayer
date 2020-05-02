import {produce} from "../vendor/immer.js";

/**
 * Holds information about the user, is a Redux reducer
 */
export function AppReducer (state = {
  path: 'pray',
  language: 'Dutch'
}, action) {
  return produce(state, nextState => {
    if (action.type === 'navigate') nextState.path = action.payload.path;
    if (action.type === 'set-language') nextState.language = action.payload.language;
  });
}