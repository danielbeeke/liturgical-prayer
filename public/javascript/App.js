/**
 * This file is a CustomElement but for convenience it is placed in the root of the application.
 * This is the starting file of this application.
 *
 * Created by Daniël Beeke
 */
import {BaseElement} from './Core/BaseElement.js';
import {Store} from './Core/Store.js';

import {routes as prayerSelectRoutes} from './CustomElements/PrayerSelect.js';
import {routes as prayerHomeRoutes} from './CustomElements/PrayerHome.js';

import {I14n} from './Helpers/I14n.js';
import {Router} from './Core/Router.js';

customElements.define('prayer-app', class PrayerApp extends BaseElement {

  /**
   * This is the main startup function of the app.
   */
  async connectedCallback () {
    let a = Store.getState().app;
    this.t = await I14n(a.language);

    let routes = Object.assign({},
      prayerSelectRoutes,
      prayerHomeRoutes
    );

    this.router = new Router({
      routes: routes,
      debug: false,
      initialPath: a.path
    });

    /**
     * Keep the router in sync with the store and draw after each route change.
     */
    this.watch('app.path', (path) => {
      this.router.sync(path);
      this.draw();
    });

    this.draw();
  }

  draw () {
    return this.router.currentRoute.template;
  }

});
