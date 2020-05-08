import {BaseElement} from '../Core/BaseElement.js';
import {html} from '../vendor/uhtml.js';
import {Content} from '../Content.js';
import {toLines} from '../Helpers/toLines.js';

customElements.define('prayer-about', class PrayerHome extends BaseElement {

  draw () {
    let page = Content['Pages'].find(page => page.Title === 'About');

    return html`
      <h2 class="page-title">${page.Title}</h2>
      <p>${toLines(page.Content)}</p>
    `;
  }
});