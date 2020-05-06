import {BaseElement} from '../Core/BaseElement.js';
import {html} from '../vendor/uhtml.js';
import {Content} from '../Content.js';

customElements.define('prayer-background', class PrayerBackground extends BaseElement {

  draw () {
    let background = Content['Backgrounds'][0];

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
