import {BaseElement} from '../Core/BaseElement.js';
import {html} from '../vendor/uhtml.js';
import {Content} from '../Content.js';
import {Slugify} from '../Helpers/Slugify.js';

export class PrayerMainMenu extends BaseElement {

  constructor() {
    super(import.meta);
  }

  draw () {
    let t = this.root.t;

    let links = Content.Pages.map(page => {
      page.Slug = '/' + Slugify(page.Title);
      return page;
    });

    links = [...links, ...[
      { Slug: '/pray', Title: t.direct('Home'), Icon: 'compass', Weight: 1},
      { Slug: '/calendar', Title: t.direct('Past prayers'), Icon: 'calendar', Weight: 98},
      { Slug: '/settings', Title: t.direct('Settings'), Icon: 'settings' , Weight: 99},
    ]];

    links = links.sort((a, b) => a.Weight - b.Weight);

    return html`
      <div class="main-menu">

        <div class="logo-wrapper">
          <img src="/images/logo.svg">
        </div>

        ${links.map(link => html`
          <a class="menu-item" href="${link.Slug}">
            <prayer-icon name="${link.Icon}" />
            <span class="title">${link.Title}</span>
          </a>
        `)}
        
      </div>

    `;
  }
}