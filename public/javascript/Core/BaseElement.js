import {render} from '../vendor/uhtml.js';
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

      let page = document.querySelector('.page');

      if (page) {
        setTimeout(() => {
          page.classList.remove('hidden');
        });
      }

      this.afterDraw();

      let inputs = this.querySelectorAll('input:not(.datepicker-button-input),textarea');
      inputs.forEach(input => {
        input.addEventListener('focus', () => {
          document.body.classList.add('has-focused-input');
        });
        input.addEventListener('blur', () => {
          document.body.classList.remove('has-focused-input');
        });
      });

      /**
       * After the draw attach click handler for internal hrefs.
       * @type {NodeListOf<HTMLElementTagNameMap[string]> | NodeListOf<Element> | NodeListOf<SVGElementTagNameMap[string]>}
       */
      let links = document.querySelectorAll('a');
      links.forEach(link => {
        if (typeof link.hasListener === 'undefined') {
          link.hasListener = true;

          if (link.getAttribute('href') === location.pathname) link.classList.add('active');

          link.addEventListener('click', event => {
            if (link.getAttribute('href').substr(0,4) === 'http') {
              return;
            }

            event.preventDefault();

            if (link.getAttribute('href') === location.pathname) return;

            let activeLinks = document.body.querySelectorAll('a.active');

            [...activeLinks].forEach(activeLink => {
              activeLink.classList.remove('active');
            });

            links.forEach(innerLink => {
              let isCurrent = innerLink.getAttribute('href') === link.getAttribute('href');
              innerLink.classList[isCurrent ? 'add' : 'remove']('active')
            });

            let page = document.querySelector('.page');

            if (page) {
              page.addEventListener('transitionend', () => {
                that.root.router.navigate(link.getAttribute('href'));
              }, {once: true});
              page.classList.add('hidden');
            }
            else {
              that.root.router.navigate(link.getAttribute('href'));
            }
          });

        }
      })
    };
  }

  get route () {
    return this.root.router.currentRoute;
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
        let oldValue = oldVal.get(objectPath);
        let newValue = newVal.get(objectPath);

        if (newValue !== oldValue) {
          callback(newValue, oldValue);
        }
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

  afterDraw () {}

  tokenize (content) {
    return this.root.tokenizer.replace(content);
  }
}