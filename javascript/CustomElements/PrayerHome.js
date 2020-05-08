import {BaseElement} from '../Core/BaseElement.js';
import {Store} from '../Core/Store.js';
import {html} from '../vendor/uhtml.js';

customElements.define('prayer-home', class PrayerHome extends BaseElement {

  draw () {
    let s = Store.getState().schedule;
    let t = this.root.t;

    this.dataset.items = s.moments.filter(moment => moment.enabled).length.toString();

    return html`

    <span class="prefix">${t`Welcome,`}</span>
    <h1 class="title">${t`Some beautiful prayers are to be prayed.`}</h1>
    
    <div class="moments slider">
      ${s.moments.filter(moment => moment.enabled).map(moment => html`
        <a class="moment card" href="${'/pray/' + moment.slug}">
        <div class="image" style="${`background-image: url(${moment.background});`}"></div>
            <span class="button">${t`Pray`}</span>
          <span class="title">${t.direct(moment.name)}</span>
        </a>
      `)}
      
      <div class="end"></div>
    </div>
    
    <div class="end"></div>
    `;
  }
});