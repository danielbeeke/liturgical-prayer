import {BaseElement} from '../Core/BaseElement.js';
import {html} from '../vendor/uhtml.js';
import {remoteStorage} from '../Core/RemoteStorage.js';

export class RemoteStorageWidget extends BaseElement {

  constructor() {
    super();
    this.rs = remoteStorage;
    this.setupHandlers();
    this.showLogin = false;
    this.remoteStorageEmail = '';
    this.dataset.online = navigator.onLine;
    this.online = navigator.onLine;
    this.error = '';
    this.isSyncing = false;
  }

  /**
   * Setup all event handlers
   */
  setupHandlers () {
    this.rs.on('connected', () => this.eventHandler('connected'));
    this.rs.on('ready', () => this.eventHandler('ready'));
    this.rs.on('disconnected', () => this.eventHandler('disconnected'));
    this.rs.on('network-online', () => this.eventHandler('network-online'));
    this.rs.on('network-offline', () => this.eventHandler('network-offline'));
    this.rs.on('error', (error) => this.error = error);
    window.addEventListener('online', () => {this.online = this.dataset.online = true; this.draw()});
    window.addEventListener('offline',  () => {this.online = this.dataset.online = false; this.draw()});

    this.rs.on('wire-busy', () => {
      this.isSyncing = true;
      this.draw();
    });

    this.rs.on('sync-req-done', () => () => {
      this.isSyncing = true;
      this.draw();
    });

    ['sync-done', 'wire-done'].forEach(eventName => {
      this.rs.on(eventName, () => {
        this.isSyncing = false;
        this.draw();
      });
    });

  }

  /**
   * Handles events
   * @param event
   * @param msg
   */
  eventHandler (event, msg) {
    this.error = '';
    this.status = event;
    this.dataset.status = event;
    this.draw();
  }

  sync () {
    this.rs.client.getObject('settings');
  }

  statusText () {
    let t = window.t;
    if (this.online) {
      return this.isSyncing ? t.direct('Syncing') : t.direct('connected');
    }
    else {
      return t.direct('offline');
    }
  }

  connect (provider) {
    history.pushState({}, 'callback', 'callback');

    if (provider === 'remotestorage') {
      this.rs.connect(this.remoteStorageEmail.trim());
    }
    else {
      this.rs[provider].connect();
    }
  }

  draw () {
    let t = window.t;
    let readMore = html`
      ${t.direct('This app allows you to sync the data with a storage of your choice.')} 
      <a class="rs-help" href="https://remotestorage.io/" target="_blank">${t.direct('Read more about syncing')}</a>.
    `;

    let choose = html`<div class="choose">
      <div class="description">
        ${readMore}
      </div>
      
      ${this.rs.apiKeys.hasOwnProperty('dropbox') ? html`<button class="button has-icon dropbox secondary block" onclick="${() => this.connect('dropbox')}">
        Dropbox
        <img alt="dropbox" class="dropbox-logo" src="/images/dropbox.svg">
      </button><br>` : ''}
      
      ${this.rs.apiKeys.hasOwnProperty('googledrive') ? html`<button class="button has-icon googledrive secondary block" onclick="${() => this.connect('googledrive')}">
        Google Drive
        <img alt="googledrive" class="googledrive-logo" src="/images/googledrive.svg">
      </button><br>` : ''}
      
      <button class="button rs secondary block has-icon" onclick="${() => {this.showLogin = true; this.draw()}}">
        RemoteStorage
        <img alt="remotestorage" class="rs-logo" src="/images/remotestorage.svg">
      </button>
      
    </div>`;

    let signIn = html`<div class="sign-in" >
      <div class="description">
        ${readMore}
      </div>
      <form name="rs-sign-in-form" class="rs-sign-in-form" onsubmit="${event => {event.preventDefault(); this.connect('remotestorage')}}">
        <div class="field-inner">
            <input type="text" .value="${this.remoteStorageEmail}" onkeyup="${event => this.remoteStorageEmail = event.target.value}" name="rs-user-address" placeholder="user@provider.com" autocapitalize="off">
        </div>

        <span class="buttons">
          <button id="submit-remotestorage" name="submit-remotestorage" type="submit" class="button">${t.direct('Connect')}</button>
          <button class="button secondary" onclick="${event => {event.preventDefault(); this.showLogin = false; this.draw()}}">${t.direct('Cancel')}</button>
        </span>

      </form>
      
    </div>`;

    let error = html`<div class="errors">
        <div class="rs-error-message"></div>
        <div class="rs-error-buttons">
          <button class="button has-icon rs-disconnect" onclick="${() => this.rs.disconnect()}">
            <img alt="power" src="/images/cross.svg" class="rs-icon rs-power-icon" />
          </button>
        </div>
      </div>`;

    let iconBrand = this.rs.backend ? this.rs.backend : false;

    let customIcon = false;
    if (this.rs.backend === 'remotestorage' && this.rs.remote.userAddress && this.rs.remote.connected) {
      let provider = this.rs.remote.userAddress.split('@')[1];
      customIcon = `https://logo.clearbit.com/${provider}`;
    }

    let connected = html`<div class="${'connected' + (this.isSyncing ? ' is-syncing' : '')}">
      <img alt="logo" class="rs-main-logo" id="${`logo-${iconBrand}`}" src="${customIcon ? customIcon : `/images/${iconBrand}.svg`}">
      <div class="rs-connected-text">
        <h3 class="title">${this.rs.remote.userAddress}</h3>
        <div class="description">${this.statusText()}</div>
      </div>
      <div class="rs-connected-buttons">
        ${this.rs.hasFeature('Sync') ? html`<button class="button only-icon" onclick="${() => this.sync()}">
          <img alt="loop icon" src="/images/loop.svg" class="rs-icon rs-loop-icon">
        </button>` : ''}
        <button class="button only-icon" onclick="${() => this.rs.disconnect()}">
          <img alt="power icon" src="/images/cross.svg" class="rs-icon rs-power-icon" />
        </button>
      </div>
    </div>`;

    return html`
      ${this.rs.remote.connected ? connected : ''}
      ${!this.showLogin && !this.rs.remote.connected ? choose : ''}
      ${this.showLogin ? signIn : ''}
      ${this.status === 'error' ? error : ''}
    `
  }
}