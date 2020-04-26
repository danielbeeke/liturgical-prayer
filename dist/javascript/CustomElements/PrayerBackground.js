import {BaseElement} from '../Core/BaseElement.js';
import {html} from '../vendor/lighterhtml.js';

customElements.define('prayer-background', class PrayerBackground extends BaseElement {

  draw () {
    let background = prayerData['Backgrounds'][0];

    return html`
      ${background.Type === 'video' ? 
      html`
        <video class="hidden" autoplay onloadedmetadata="this.muted = true" onplay="this.classList.remove('hidden')">
            <source src="${background.Link}">
        </video>` : 
      html`<img src="${background.Link}" />`}
    `;
  }
});
