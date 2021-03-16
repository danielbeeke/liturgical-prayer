import {BaseElement} from '../Core/BaseElement.js';
import {html} from '../vendor/uhtml.js';
import {Content} from '../DataLoader.js';
import {toLines} from '../Helpers/toLines.js';

export class PrayerPage extends BaseElement {

  draw () {
    let page = Content['Pages'].find(page => page.slug === location.pathname.substr(1));

    return html`
      <prayer-main-menu />
      <div class="inner-page">
        <h2 class="page-title">
          <prayer-icon name="${page.Icon}" />
          ${page.Title}
        </h2>
        <p>${toLines(page.Content)}</p>
        <div class="end"></div>
      </div>
    `;
  }

  forceDraw() {
    this.draw();
  }

}
