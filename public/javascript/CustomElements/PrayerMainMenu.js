import {BaseElement} from '../Core/BaseElement.js';
import {html} from 'https://cdn.skypack.dev/uhtml/async'
import {Content} from '../Content.js';

export class PrayerMainMenu extends BaseElement {

  draw () {
    let t = this.root.t;
    let isTablet = window.outerWidth > 700;
    let anotherPage = [isTablet ? 'another-page' : ''];

    let links = Content.Pages.map(page => {
      page.extraClasses = [isTablet ? 'another-page' : ''];
      return page;
    });

    links = [...links, ...[
      { id: 'pray', name: t.direct('Home'), icon: 'compass', weight: -100, extraClasses: []},
      { id: 'settings', name: t.direct('Settings'), weight: 98, extraClasses: anotherPage},
      { id: 'calendar', name: t.direct('Past prayers'), icon: 'calendar', weight: 99, extraClasses: anotherPage},
    ]];

    links = links.sort((a, b) => a.weight ?? 0 - b.weight ?? 0);

    return html`
      <div class="main-menu">

        <div class="logo-wrapper">
          <img alt="logo" src="/images/logo.svg">
        </div>

        ${links.map(link => {
          let parts = location.pathname.split('/');
          let firstPart = parts[1];

          return html`
          <a class="${`menu-item ${link.extraClasses.join(' ')} ${link.id === firstPart ? 'active' : ''}`}" href="${link.id}">
            <prayer-icon name="${link.id}" />
            <span class="title">${link.name}</span>
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