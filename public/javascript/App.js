/**
 * This file is a CustomElement but for convenience it is placed in the root of the application.
 * This is the starting file of this application.
 *
 * Created by Daniël Beeke
 */
import {BaseElement} from './Core/BaseElement.js';
import {Store} from './Core/Store.js';

import './CustomElements/PrayerSettings.js';
import './CustomElements/PrayerHome.js';
import './CustomElements/PrayerPray.js';
import './CustomElements/PrayerMomentConfigure.js';
import './CustomElements/PrayerCategoryDetails.js';
import './CustomElements/PrayerCreateFreeCategory.js';
import './CustomElements/PrayerBackground.js';
import './CustomElements/PrayerMenu.js';

import {I14n} from './Helpers/I14n.js';
import {Router} from './Core/Router.js';
import {html} from './vendor/lighterhtml.js';

customElements.define('prayer-app', class PrayerApp extends BaseElement {

  /**
   * This is the main startup function of the app.
   */
  async connectedCallback () {
    let a = Store.getState().app;
    this.t = await I14n(a.language);

    let routes = {
      'pray': { template: html`<prayer-home class="page" /><prayer-menu />` },
      'settings': { template: html`<prayer-settings class="page" /><prayer-menu />` },
      'settings/:moment': { template: html`<prayer-moment-configure />` },
      'pray/:moment': { template: html`<prayer-pray class="page" /><prayer-menu />` },
      'settings/:moment/prayer-category/:category': { template: html`<prayer-category-details />` },
      'settings/:moment/create-free-category': { template: html`<prayer-create-free-category />` },
    };

    this.router = new Router({
      routes: routes,
      debug: false,
      initialPath: location.pathname.substr(1) ? location.pathname.substr(1) : 'pray'
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


    this.draw();
  }

  draw () {
    return this.router.currentRoute ? this.router.currentRoute.template : null;
  }

});
