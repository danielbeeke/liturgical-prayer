import {BaseElement} from '../Core/BaseElement.js';
import {Store} from '../Core/Store.js';
import {html} from '../vendor/uhtml.js';
import {getCurrentActiveMoment} from '../Helpers/getCurrentActiveMoment.js';

export class PrayerHome extends BaseElement {

  draw () {
    let t = this.root.t;
    let s = Store.getState().schedule;

    this.dataset.items = s.moments.filter(moment => moment.enabled).length.toString();

    return html`

    <div class="logo-wrapper">
      <img alt="logo" src="/images/logo.svg">
    </div>
    
    <h1 class="title">${t`Some beautiful prayers are to be prayed.`}</h1>
    
    <div class="moments moments-slider">
      ${s.moments.filter(moment => moment.enabled).map(moment => html`
        <a class="moment card" data-moment="${moment.slug}" href="${'/pray/' + moment.slug}" style="${`--color-primary: ${moment.color};  --color-secondary: ${moment.colorBackground}`}">
          <div class="image" style="${`background-image: url(/images/${moment.slug}.jpg);`}"></div>
          <span class="button has-icon">
            ${t`Pray`}
            <prayer-icon name="arrow-right" />
          </span>
          <span class="title">${t.direct(moment.name)}</span>
        </a>
      `)}
      
      <div class="end"></div>
    </div>
    
    <div class="end"></div>
    `;
  }

  afterDraw() {
    super.afterDraw();
    let s = Store.getState().schedule;
    let activeMoment = getCurrentActiveMoment(s.moments);

    if (activeMoment) {
      let activeMomentCard = this.querySelector(`[data-moment="${activeMoment.slug}"]`);
      activeMomentCard.scrollIntoView();
    }
  }
}