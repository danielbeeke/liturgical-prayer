import {BaseElement} from '../Core/BaseElement.js';
import {html} from '../vendor/uhtml.js';

export class PrayerStorageCallback extends BaseElement {

  draw() {
    if (location.hash === '') this.root.router.navigate('/settings');
    return html`<span></span>`;
  }
}