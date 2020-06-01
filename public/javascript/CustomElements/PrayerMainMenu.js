import {BaseElement} from '../Core/BaseElement.js';
import {html} from '../vendor/uhtml.js';
import {Content} from '../Content.js';
import {Slugify} from '../Helpers/Slugify.js';

export class PrayerMainMenu extends BaseElement {

  draw () {
    let t = this.root.t;
    let isTablet = window.outerWidth > 700;
    let anotherPage = [isTablet ? 'another-page' : ''];

    let links = Content.Pages.map(page => {
      page.Slug = '/' + Slugify(page.Title);
      page.ExtraClasses = [isTablet ? 'another-page' : ''];
      return page;
    });

    links = [...links, ...[
      { Slug: '/pray', Title: t.direct('Home'), Icon: 'compass', Weight: 1, ExtraClasses: []},
      { Slug: '/calendar', Title: t.direct('Past prayers'), Icon: 'calendar', Weight: 98, ExtraClasses: anotherPage},
      { Slug: '/settings', Title: t.direct('Settings'), Icon: 'settings' , Weight: 99, ExtraClasses: anotherPage},
    ]];


    links = links.sort((a, b) => a.Weight - b.Weight);

    return html`
      <div class="main-menu">

        <div class="logo-wrapper">
          <img alt="logo" src="/images/logo.svg">
        </div>

        ${links.map(link => {
          let parts = location.pathname.split('/');
          let firstPart = '/' + parts[1];

          return html`
          <a class="${`menu-item ${link.ExtraClasses.join(' ')} ${link.slug === firstPart ? 'active' : ''}`}" href="${link.Slug}">
            <prayer-icon name="${link.Icon}" />
            <span class="title">${link.Title}</span>
          </a>
        `})}
        
      </div>

    `;
  }

  afterDraw() {
    let links = this.querySelectorAll('prayer-main-menu a.another-page');
    links.forEach(link => {
      link.addEventListener('click', () => {
        let page = document.querySelector('.page');
        page.classList.add('to-another-page');
        page.addEventListener('transitionend', () => {
          page.classList.remove('to-another-page');
        }, {once: true});
      })
    });

    super.afterDraw();
  }
}