import {BaseElement} from '../Core/BaseElement.js';

customElements.define('prayer-icon', class PrayerIcon extends BaseElement {

  async connectedCallback () {
    let name = this.getAttribute('name');
    let response = await fetch(`/images/${name}.svg`);
    this.innerHTML = await response.text();
  }
});
