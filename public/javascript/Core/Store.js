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

const client = remoteStorage.scope('/LiturgicalPrayerApp/');
client.declareType('settings', {
  "type": "object",
});

Store.subscribe(function () {
  const state = Object.assign({}, Store.getState());
  client.storeObject('settings', 'settings', state);
});

remoteStorage.on('sync-done', () => {
  client.getObject('settings').then(remoteState => {
    delete remoteState['@context'];
    Store.replaceState(remoteState);
    let app = document.querySelector('prayer-app');
    app.draw();
    [...app.children].forEach(child => typeof child.draw !== 'undefined' ? child.draw() : null);
  });
});