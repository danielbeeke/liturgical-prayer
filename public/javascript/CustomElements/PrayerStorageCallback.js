import {BaseElement} from '../Core/BaseElement.js';
import {html} from '../vendor/uhtml.js';

export class PrayerStorageCallback extends BaseElement {
  constructor() {
    super(import.meta);
  }

  draw() {
    if (location.hash === '') this.root.router.navigate('/settings');
    return html`<span></span>`;
  }
}