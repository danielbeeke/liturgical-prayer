import {BaseElement} from '../Core/BaseElement.js';
import {html} from '../vendor/uhtml.js';
import {Content} from '../Content.js';
import {toLines} from '../Helpers/toLines.js';

customElements.define('prayer-page', class PrayerHome extends BaseElement {

  draw () {
    let page = Content['Pages'].find(page => page.slug === location.pathname.substr(1));

    return html`
      <h2 class="page-title">
        <prayer-icon name="${page.Icon}" />
        ${page.Title}
      </h2>
      <p>${toLines(page.Content)}</p>
      <div class="end"></div>
    `;
  }
});