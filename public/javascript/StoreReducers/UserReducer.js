import {produce} from "../vendor/immer.js";

/**
 * Holds information about the user, is a Redux reducer
 */
export function UserReducer (state = {
  name: 'John Doe'
}, action) {
  return produce(state, nextState => {

  });
}