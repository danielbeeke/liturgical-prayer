import {BaseElement} from '../Core/BaseElement.js';

customElements.define('prayer-icon', class PrayerIcon extends BaseElement {

  async connectedCallback () {
    let name = this.getAttribute('name');
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
});
