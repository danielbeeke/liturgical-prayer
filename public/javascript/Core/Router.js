import { navigate } from '../Actions/AppActions.js';

/**
 * Client side router with hash history
 */
export class Router {
  /**
   * Create a new instance of a client side router
   * @param {Object} options Router options
   * @param {boolean} [options.debug=false] - Enable debugging console messages
   * @param {Object} [options.context=window] - Context to listen for changes on
   * @param {boolean} [options.startListening=true] - Initiate listen on construct
   * @param {Object} [options.routes={}] - Initiate routes on construct
   * @param {string} [options.initialPath=''] - Initiate routes on construct
   */
  constructor(options) {
    this.options = Object.assign(
      {
        debug: false,
        context: window,
        routes: {}
      },
      options
    );

    this.isListening = false;
    this.routes = [];

    if (options.routes) {
      for (let [route, routeOptions] of Object.entries(options.routes)) {
        this.add(route, routeOptions);
      }
    }

    this.onHashChange = this.check.bind(this);
    this.listen();

    if (this.options.initialPath) {
      this.sync(this.options.initialPath);
    }
  }

  /**
   * Add a new route
   * @param {string|RegExp|function} route - Name of route to match or global function
   * @param {function=} routeOptions - Object with a handler to execute when route matches
   * @returns {Router} - This router instance
   */
  add(route, routeOptions) {
    let newRoute = typeof route === 'string' ? Router.cleanPath(route) : route;

    let newRouteSplit = newRoute.split('/');
    let replacedParts = [];
    let tokens = [];
    newRouteSplit.forEach(part => {
      if (part.substr(0, 1) === ':') {
        replacedParts.push('([\-a-zA-Z0-9\\-]*)');
        tokens.push(part.substr(1));
      }
      else {
        replacedParts.push(part);
      }
    });

    let regexRoute = '^' + replacedParts.join('/') + '$';
    newRoute = new RegExp(regexRoute);

    this.routes.push(Object.assign({
      path: route,
      tokens: tokens,
      route: newRoute,
    }, routeOptions));

    return this;
  }

  /**
   * Reload the current route
   * @returns {Router} - This router instance
   */
  reload() {
    return this.check();
  }

  sync (path) {
    if (!this.match(path)) return;

    this.options.context.history.pushState(
      null,
      null,
      '/' + Router.cleanPath(path || '')
    );
  }

  /**
   * Recheck the path and reload the page
   * @private
   * @returns {Router} - This router instance
   */
  check() {
    let hash = Router.cleanPath(location.pathname + (location.search ? location.search : ''));

    let originalHash = hash;

    hash = hash.split('?')[0];

    for (let route of this.routes) {
      const match = hash.match(route.route);

      if (match !== null) {
        match.shift();

        navigate(originalHash);

        if (this.options.debug) {
          console.log(`Fetching: /${hash}`);
        }
      }
    }

    return this;
  }

  /**
   * Start listening for hash changes on the context
   * @param {any} [instance=Window] - Context to start listening on
   * @returns {Router} - This router instance
   */
  listen(instance) {
    this.check();

    if (!this.isListening || instance) {
      (instance || this.options.context).addEventListener(
        'hashchange',
        this.onHashChange
      );

      this.isListening = true;
    }

    return this;
  }

  /**
   * Navigate router to path
   * @param {string} path - Path to navigate the router to
   * @returns {Router} - This router instance
   */
  navigate(path) {
    if (this.options.debug) {
      console.log(`Redirecting to: /${Router.cleanPath(path || '')}`);
    }

    this.options.context.history.pushState(
      null,
      null,
      '/' + Router.cleanPath(path || '')
    );

    window.dispatchEvent(new CustomEvent('hashchange'));

    return this;
  }

  match (path) {
    path = Router.cleanPath(path);

    path = path.split('?')[0];

    let activeRoute = null;
    for (let route of this.routes) {
      const match = path.match(route.route);

      if (match !== null && !activeRoute) {
        match.shift();

        let tokens = {};
        route.tokens.forEach((tokenName, index) => {
          tokens[tokenName] = match[index];
        });

        activeRoute = Object.assign({}, route, {
          parameters: tokens
        });

        if (this.options.debug) {
          console.log(`Syncing: /${path}`);
        }
      }
    }

    return activeRoute;
  }

  /**
   * Name of the current route
   * @returns {object} - Current route
   */
  get currentRoute() {
    return this.match(location.pathname + (location.search ? location.search : ''));
  }

  /**
   * Strip the path of slashes and hashes
   * @param {string} path - Path to clean of hashes
   * @returns {string} - Cleaned path
   */
  static cleanPath(path) {
    if (!path) {
      return '';
    }

    return String(path).replace(/^[#\/]+|\/+$|$/g, '');
  }

  /**
   * Parse a route URL to get all parts
   * @param {string} path - Route to split into parts
   * @returns {string[]} - Parts of the URL
   */
  static parseRoute(path) {
    return Router.cleanPath(path).split('/');
  }
  
  part (index) {
    let split =  location.pathname.split('/');
    return typeof split[index] !== 'undefined' ? split[index] : false;
  }
}