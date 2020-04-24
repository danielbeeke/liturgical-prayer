import {BaseElement} from '../Core/BaseElement.js';
import {html} from '../vendor/lighterhtml.js';

customElements.define('prayer-category-information', class PrayerCategoryInformation extends BaseElement {

  connectedCallback() {
    super.connectedCallback();
  }

  draw () {
    return html`
      <span class="button">?</span>
      <div class="tooltip-popup">${this.text}</div>
    `;
  }
});