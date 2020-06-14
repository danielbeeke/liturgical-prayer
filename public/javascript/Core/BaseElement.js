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
    this.root = document.querySelector('prayer-app');
    this.attachDraw(this.draw);
  }

  attachDraw (elementDraw) {
    this.draw = function () {
      render(this, () => elementDraw.apply(this, arguments));
      this.afterDraw();
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

  afterDraw () {
    let page = document.querySelector('.page');
    let that = this;

    // if (page && page === this && page.classList.contains('hidden')) {
    //   console.log('6. Current page', this.root.dataset.transition);
    //
    //   if (this.root.dataset.transition) {
    //     console.log('7. Attach transition end begin');
    //
    //     page.addEventListener('transitionend', (event) => {
    //       this.root.dataset.transition = '';
    //       console.log('9, transition end ran');
    //     }, {
    //       once: true
    //     });
    //   }
    //
    //   console.log('8. removed hidden');
    //   page.classList.remove('hidden');
    // }

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
          if (!link.getAttribute('href') || link.getAttribute('href').substr(0,4) === 'http') {
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

          link.classList.add('active');

          this.root.dataset.transition = this.getTransitionName(link.getAttribute('href'));

          page.addEventListener('transitionend', () => {
            that.root.router.navigate(link.getAttribute('href'));
            let newPage = document.querySelector('.page.hidden');

            if (newPage) {
              newPage.addEventListener('transitionend', (event) => {
                this.root.dataset.transition = '';
              }, {
                once: true
              });

              setTimeout(() => {
                newPage.classList.remove('hidden');
              })

            }
          }, {once: true});
          page.classList.add('hidden');
        });

      }
    })
  }

  getTransitionName (nextPath) {
    let currentName = this.route.name;
    let nextRoute = this.root.router.match(nextPath);
    if (!nextRoute) return 'default';
    let nextName = nextRoute.name;
    let isTablet = window.outerWidth > 700;

    let pageTypes = ['page', 'calendar', 'calendar-details', 'settings', 'menu', 'settings-moment-category', 'settings-moment-create-item', 'settings-moment-edit-item', 'settings-moment'];

    if (nextName === 'calendar-details' && currentName === 'calendar-details') {
      return 'calendar';
    }

    if (pageTypes.includes(nextName) && pageTypes.includes(currentName) && isTablet) {
     return 'page';
    }

    return 'default';
  }

  tokenize (content) {
    return this.root.tokenizer.replace(content);
  }

  /**
   * If your component will not be re connected you can use this.
   */
  forceDraw () {}
}