import {render} from '../vendor/lighterhtml.js';
import {watch} from '../vendor/ReduxWatch.js';
import {Store} from "./Store.js";

/**
 * Some helpers to easily create Custom Elements composed in a base class.
 */
export class BaseElement extends HTMLElement {
  constructor () {
    super();
    this.interval = false;
    this.subscribers = [];

    // Binds draw to the element.
    const elementDraw = this.draw;
    let that = this;
    this.root = document.querySelector('prayer-app');
    this.draw = function () {
      render(this, () => elementDraw.apply(this, arguments));


      /**
       * After the draw attach click handler for internal hrefs.
       * @type {NodeListOf<HTMLElementTagNameMap[string]> | NodeListOf<Element> | NodeListOf<SVGElementTagNameMap[string]>}
       */
      let links = this.querySelectorAll('a');
      links.forEach(link => {
        if (typeof link.hasListener === 'undefined') {
          link.hasListener = true;
          link.addEventListener('click', event => {
            event.preventDefault();
            that.root.router.navigate(link.getAttribute('href'));
          });

          if (link.getAttribute('href') === location.pathname) link.classList.add('active');
        }
      })
    };
  }

  connectedCallback () {
    this.draw();
  }

  /**
   * API, needs to be implemented by the child element.
   * Holds the lighterHTML template.
   */
  draw () {
    throw new Error('Please implement draw() method');
  }

  /**
   * A wrapper around redux-watch.
   * The element knows which subscribers there are and unsubscribes them when removed from the DOM.
   * @param objectPath
   * @param callback
   */
  watch (objectPath, callback) {
    if (!Array.isArray(objectPath)) { objectPath = [objectPath] }

    const wrappedWatch = function(objectPath, callback) {
      return Store.subscribe(watch(Store.getState, objectPath)((newVal, oldVal, objectPath) => {
        callback(newVal.get(objectPath), oldVal.get(objectPath));
      }));
    };

    objectPath.forEach(objectPathItem => this.subscribers.push(wrappedWatch(objectPathItem, callback)));
  }

  /**
   * When removed from the DOM unsubscribe all redux subscribers.
   */
  disconnectedCallback () {
    this.subscribers.forEach(unsubscribe => unsubscribe());

    if (this.interval) {
      clearInterval(this.interval)
    }
  }
}