import {RemoteStorage} from './../vendor/RemoteStorage.js';
import {replaceState} from '../Actions/AppActions.js';

export const remoteStorage = new RemoteStorage();
remoteStorage.setSyncInterval(360000);
remoteStorage.setApiKeys({
  dropbox: 'vn0fct0a7i84a9l',
  googledrive: '817985380080-38u25eathssicikju2qiqngmuk2u4qgg.apps.googleusercontent.com'
});
remoteStorage.access.claim('LiturgicalPrayerApp', 'rw');
remoteStorage.caching.enable('/LiturgicalPrayerApp/');

remoteStorage.client = remoteStorage.scope('/LiturgicalPrayerApp/');
remoteStorage.client.declareType('settings', {
  "type": "object",
});

remoteStorage.client.on('change', function (event) {
  if (['remote'].includes(event.origin)) {
    let remoteState = event.newValue;
    delete remoteState['@context'];
    replaceState(remoteState);
    let app = document.querySelector('prayer-app');
    app.draw();
    [...app.children].forEach(child => typeof child.draw !== 'undefined' ? child.draw() : null);
  }
});