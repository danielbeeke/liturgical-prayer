/**
 * This file is a CustomElement but for convenience it is placed in the root of the application.
 * This is the starting file of this application.
 *
 * Created by Daniël Beeke
 */

import {BaseElement} from './Core/BaseElement.js';
import {Store} from './Core/Store.js';
import {remoteStorage} from './Core/RemoteStorage.js';
import {html} from './vendor/uhtml.js';

import {toggleGrid} from './Actions/AppActions.js';

import {I14n} from './Helpers/I14n.js';
import {Router} from './Core/Router.js';
import {Routes} from './Core/Routes.js'
import {Tokenizer} from './Helpers/Tokenizer.js';
import {PrayerCalendar} from './CustomElements/PrayerCalendar.js';
import {PrayerCategoryDetails} from './CustomElements/PrayerCategoryDetails.js';
import {PrayerCategoryPrayerPoint} from './CustomElements/PrayerCategoryPrayerPoint.js';
import {PrayerCategoryPrayerPointCreate} from './CustomElements/PrayerCategoryPrayerPointCreate.js';
import {PrayerCreateFreeCategory} from './CustomElements/PrayerCreateFreeCategory.js';
import {PrayerDayOverview} from './CustomElements/PrayerDayOverview.js';
import {PrayerHome} from './CustomElements/PrayerHome.js';
import {PrayerIcon} from './CustomElements/PrayerIcon.js';
import {PrayerMainMenu} from './CustomElements/PrayerMainMenu.js';
import {PrayerMenu} from './CustomElements/PrayerMenu.js';
import {PrayerMomentConfigure} from './CustomElements/PrayerMomentConfigure.js';
import {PrayerPray} from './CustomElements/PrayerPray.js';
import {PrayerPage} from './CustomElements/PrayerPage.js';
import {PrayerPrayer} from './CustomElements/PrayerPrayer.js';
import {PrayerSettings} from './CustomElements/PrayerSettings.js';
import {PrayerStorageCallback} from './CustomElements/PrayerStorageCallback.js';
import {RemoteStorageWidget} from './CustomElements/RemoteStorageWidget.js';
import {enableHmr} from './Core/Hmr.js';
import {PrayerAddNote} from './CustomElements/PrayerAddNote.js';

let customElementItems = [
  {tag: 'prayer-calendar', className: PrayerCalendar},
  {tag: 'prayer-category-details', className: PrayerCategoryDetails},
  {tag: 'prayer-category-prayer-point', className: PrayerCategoryPrayerPoint},
  {tag: 'prayer-category-prayer-point-create', className: PrayerCategoryPrayerPointCreate},
  {tag: 'prayer-create-free-category', className: PrayerCreateFreeCategory},
  {tag: 'prayer-day-overview', className: PrayerDayOverview},
  {tag: 'prayer-home', className: PrayerHome},
  {tag: 'prayer-icon', className: PrayerIcon},
  {tag: 'prayer-main-menu', className: PrayerMainMenu},
  {tag: 'prayer-menu', className: PrayerMenu},
  {tag: 'prayer-moment-configure', className: PrayerMomentConfigure},
  {tag: 'prayer-page', className: PrayerPage},
  {tag: 'prayer-pray', className: PrayerPray},
  {tag: 'prayer-prayer', className: PrayerPrayer},
  {tag: 'prayer-settings', className: PrayerSettings},
  {tag: 'prayer-storage-callback', className: PrayerStorageCallback},
  {tag: 'remote-storage-widget', className: RemoteStorageWidget},
  {tag: 'prayer-add-note', className: PrayerAddNote},
];

customElementItems.forEach(item => {
  customElements.define(item.tag, item.className);
  enableHmr(`${location.origin}/javascript/CustomElements/${item.className.name}.js`, customElementItems);
});

customElements.define('prayer-app', class PrayerApp extends BaseElement {

  /**
   * This is the main startup function of the app.
   */
  async connectedCallback () {
    this.customElements = customElementItems;

    let a = Store.getState().app;

    this.storage = remoteStorage;

    this.t = await I14n(a.language);
    this.tokenizer = new Tokenizer();

    this.router = new Router({
      routes: Routes,
      debug: false,
      initialPath: location.pathname.substr(1) !== '' ? location.pathname + (location.search ? location.search : '') : 'pray'
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

    if (this.router.currentRoute && this.router.currentRoute.redirect) {
      this.router.navigate(this.router.currentRoute.redirect);
    }

    return html`
      ${this.router.currentRoute && this.router.currentRoute.template ? this.router.currentRoute.template : null}
      <prayer-menu />
    `;
  }

  afterDraw() {
    this.children[0].forceDraw();
  }

});

window.oncontextmenu = function(event) {
  event.preventDefault();
  event.stopPropagation();
  return false;
};
