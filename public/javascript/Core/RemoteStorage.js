import {RemoteStorage} from './../vendor/RemoteStorage.js';

export const remoteStorage = new RemoteStorage();
remoteStorage.setSyncInterval(360000);
remoteStorage.setApiKeys({
  dropbox: 'vn0fct0a7i84a9l',
  googledrive: '817985380080-38u25eathssicikju2qiqngmuk2u4qgg.apps.googleusercontent.com'
});
remoteStorage.access.claim('LiturgicalPrayerApp', 'rw');
remoteStorage.caching.enable('/LiturgicalPrayerApp/');