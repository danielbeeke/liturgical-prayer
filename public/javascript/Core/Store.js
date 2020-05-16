import {createStore, applyMiddleware, compose} from '../vendor/Redux.js';
import {promiseMiddleware} from '../Middleware/PromiseMiddleware.js';
import persistState from '../vendor/redux-localstorage/persistState.js';
import {sharedCombineReducers} from '../Helpers/SharedCombineReducers.js';
import {savableSlicer} from '../Helpers/SavableSlicer.js';
import {remoteStorage} from './RemoteStorage.js';

import {AppReducer} from '../StoreReducers/AppReducer.js';
import {ScheduleReducer} from '../StoreReducers/ScheduleReducer.js';
import {PrayReducer} from '../StoreReducers/PrayReducer.js';

const initialState = {};

const reducers = sharedCombineReducers({
  app: AppReducer,
  schedule: ScheduleReducer,
  pray: PrayReducer
});

const middleware = applyMiddleware(
  promiseMiddleware,
);

const composeEnhancers = typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ : compose;

let enhancers = composeEnhancers(middleware, persistState(null, {
  slicer: savableSlicer,
}));


export const Store = createStore(reducers, initialState, enhancers);

let lastState = Store.getState();
let slice = savableSlicer();
Store.subscribe(function () {
  const state = slice(Store.getState());
  /**
   * Make sure we only write out on change and not on load.
   */
  if (JSON.stringify(state) !== JSON.stringify(lastState)) {
    remoteStorage.client.storeObject('settings', 'settings', state);
    lastState = state;
  }
});

remoteStorage.on('connected', () => {
  remoteStorage.client.getObject('settings');
});