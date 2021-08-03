import {BaseElement} from '../Core/BaseElement.js';
import {html} from 'https://cdn.skypack.dev/uhtml/async'
import {Content} from '../Content.js';

export class PrayerPage extends BaseElement {

  draw () {
    let page = Content['Pages'].find(page => page.id === location.pathname.substr(1));

    return html`
      <prayer-main-menu />
      <div class="inner-page">
        <h2 class="page-title">
          <prayer-icon name="${page.id}" />
          ${page.name}
        </h2>
        <p ref=${element => element.innerHTML = page.content}></p>
        <div class="end"></div>
      </div>
    `;
  }

  forceDraw() {
    this.draw();
  }

}