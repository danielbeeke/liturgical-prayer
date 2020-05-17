import {BaseElement} from '../Core/BaseElement.js';
import {html} from '../vendor/uhtml.js';

customElements.define('prayer-storage-callback', class PrayerStorageCallback extends BaseElement {
  constructor() {
    super();
  }

  draw() {
    if (location.hash === '') this.root.router.navigate('/settings');
    return html`<span></span>`;
  }
});