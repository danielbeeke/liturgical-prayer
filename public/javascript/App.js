/**
 * This file is a CustomElement but for convenience it is placed in the root of the application.
 * This is the starting file of this application.
 *
 * Created by Daniël Beeke
 */

import {BaseElement} from './Core/BaseElement.js';
import {Store} from './Core/Store.js';
import {remoteStorage} from './Core/RemoteStorage.js';
import './CustomElements/PrayerSettings.js';
import './CustomElements/PrayerHome.js';
import './CustomElements/PrayerPray.js';
import './CustomElements/PrayerMomentConfigure.js';
import './CustomElements/PrayerCategoryDetails.js';
import './CustomElements/PrayerCreateFreeCategory.js';
import './CustomElements/PrayerMenu.js';
import './CustomElements/PrayerIcon.js';
import './CustomElements/PrayerPage.js';
import './CustomElements/PrayerMainMenu.js';
import './CustomElements/PrayerCategoryPrayerPoint.js';
import './CustomElements/PrayerCategoryPrayerPointCreate.js';
import './CustomElements/PrayerStorageCallback.js';
import './CustomElements/RemoteStorageWidget.js';
import {html} from './vendor/uhtml.js';

import {toggleGrid} from './Actions/AppActions.js';

import {I14n} from './Helpers/I14n.js';
import {Router} from './Core/Router.js';
import {Routes} from './Core/Routes.js'
import {Tokenizer} from './Helpers/Tokenizer.js';

customElements.define('prayer-app', class PrayerApp extends BaseElement {

  /**
   * This is the main startup function of the app.
   */
  async connectedCallback () {
    let a = Store.getState().app;

    this.storage = remoteStorage;

    this.t = await I14n(a.language);
    this.tokenizer = new Tokenizer();

    this.router = new Router({
      routes: Routes,
      debug: false,
      initialPath: location.pathname.substr(1) ? location.pathname.substr(1) : 'pray'
    });

    // Helper for vertical grid.
    window.addEventListener('keyup', event => {
      if (event.shiftKey && event.key === 'G') {
        event.preventDefault();
        toggleGrid();
      }
    });

    /**
     * Keep the router in sync with the store and draw after each route change.
     */
    this.watch('app.path', (path) => {
      this.router.sync(path);
      this.draw();
    });

    /**
     * Rerender everything if the language is changed.
     */
    this.watch('app.language', async (language) => {
      this.t = await I14n(language);
      [...this.children].forEach(child => typeof child.draw !== 'undefined' ? child.draw() : null);
    });

    this.watch('app.verticalGridEnabled', (enabled) => {
      this.dataset.gridEnabled = enabled;
    });

    this.draw();
  }

  draw () {
    let a = Store.getState().app;
    this.dataset.gridEnabled = a.verticalGridEnabled;
    return html`
      ${this.router.currentRoute ? this.router.currentRoute.template : null}
      <prayer-menu />
    `;
  }

});

window.oncontextmenu = function(event) {
  event.preventDefault();
  event.stopPropagation();
  return false;
};
