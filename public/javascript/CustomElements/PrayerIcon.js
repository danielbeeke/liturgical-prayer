import {BaseElement} from '../Core/BaseElement.js';

export class PrayerIcon extends BaseElement {

  async connectedCallback () {
    await this.loadIcon();
  }

  async loadIcon () {
    let name = this.getAttribute('name');

    if (!name) return;

    if (!window.svgCache) window.svgCache = {};
    if (!window.svgCacheWaiters) window.svgCacheWaiters = {};

    if (!window.svgCache[name]) {
      let iconPromise = window.svgCache[name] = fetch(`/images/${name}.svg`);
      iconPromise
      .then(response => response.text())
      .then(response => {
        window.svgCache[name] = response;
        this.innerHTML = window.svgCache[name];

        if (window.svgCacheWaiters[name]) {
          window.svgCacheWaiters[name].forEach(callback => {
            callback();
          })
        }
      });
    }

    if (window.svgCache[name] && window.svgCache[name].then) {
      if (!window.svgCacheWaiters[name]) {
        window.svgCacheWaiters[name] = [];
      }

      window.svgCacheWaiters[name].push(() => {
        this.innerHTML = window.svgCache[name];
      });
    }
    else if (window.svgCache[name]) {
      this.innerHTML = window.svgCache[name];
    }
  }

  async attributeChangedCallback(name, oldValue, newValue) {
    if (newValue && newValue !== oldValue) await this.loadIcon();
  }

  static get observedAttributes() { return ['name']; }

}