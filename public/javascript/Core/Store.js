import {createStore, applyMiddleware, compose} from '../vendor/Redux.js';
import {promiseMiddleware} from '../Middleware/PromiseMiddleware.js';
import persistState from '../vendor/redux-localstorage/persistState.js';
import {sharedCombineReducers} from '../Helpers/SharedCombineReducers.js';
import {savableSlicer} from '../Helpers/SavableSlicer.js';

import {AppReducer} from '../StoreReducers/AppReducer.js';
import {ScheduleReducer} from '../StoreReducers/ScheduleReducer.js';

const initialState = {};

const reducers = sharedCombineReducers({
  app: AppReducer,
  schedule: ScheduleReducer
});

const middleware = applyMiddleware(
  promiseMiddleware,
);

const composeEnhancers = typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ : compose;

let enhancers = typeof navigator !== 'undefined' ?
composeEnhancers(middleware, persistState(null, {
  slicer: savableSlicer
})) : middleware;

export const Store = createStore(reducers, initialState, enhancers);