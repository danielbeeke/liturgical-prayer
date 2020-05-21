import {BaseElement} from '../Core/BaseElement.js';
import {html} from '../vendor/uhtml.js';
import {Content} from '../Content.js';
import {Slugify} from '../Helpers/Slugify.js';

customElements.define('prayer-main-menu', class PrayerMenu extends BaseElement {

  draw () {
    let t = this.root.t;

    let pages = Content.Pages.map(page => {
      page.slug = Slugify(page.Title);
      return page;
    });

    return html`
      <div class="main-menu">

        <a class="menu-item" href="/pray">
          <prayer-icon name="compass" />
          <span class="title">${t.direct('Home')}</span>
        </a>

        <a class="menu-item" href="/calendar">
          <prayer-icon name="calendar" />
          <span class="title">${t.direct('Past prayers')}</span>
        </a>

        ${pages.map(page => html`
          <a class="menu-item" href="${'/' + page.slug}">
            <prayer-icon name="${page.Icon}" />
            <span class="title">${page.Title}</span>
          </a>
        `)}
        
        <a class="menu-item" href="/settings">
          <prayer-icon name="settings" />
          <span class="title">${t.direct('Settings')}</span>
        </a>
   
      </div>

    `;
  }
});
