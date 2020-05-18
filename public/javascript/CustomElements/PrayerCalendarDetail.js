import {BaseElement} from '../Core/BaseElement.js';
import {html} from '../vendor/uhtml.js';
import {Store} from '../Core/Store.js';

customElements.define('prayer-calendar-detail', class PrayerHome extends BaseElement {

  draw () {
    this.selectedDay = new Date(this.route.parameters.date);

    let month = this.selectedDay.getMonth() + 1;
    let year = this.selectedDay.getFullYear();
    let day = this.selectedDay.getDate();
    let dateString = `${year}-${month}-${day}`;
    let calendar = Store.getState().pray.calendar;
    let selectedDayData = calendar.find(item => item.date === dateString);
    let {date, ...prayedMoments} = selectedDayData;
    let prayedMomentSlugs = Object.keys(prayedMoments);
    let s = Store.getState().schedule;

    let dayLabel = new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(this.selectedDay);

    let t = this.root.t;

    return html`
      <h2 class="page-title">
        <a class="back-button" href="/calendar"><prayer-icon name="arrow-left" /></a>
        <prayer-icon name="day" />
        ${dayLabel}
      </h2>

      ${s.moments.filter(moment => prayedMomentSlugs.includes(moment.slug)).map(moment => html`
        <a class="moment card history" data-moment="${moment.slug}" href="${'/pray/' + moment.slug}" style="${`--color-primary: ${moment.color};  --color-secondary: ${moment.colorBackground}`}">
          <div class="image" style="${`background-image: url(${moment.background});`}"></div>
          <span class="button has-icon">
            ${t`Pray`}
            <prayer-icon name="arrow-right" />
          </span>
          <span class="title">${t.direct(moment.name)}</span>
        </a>
      `)}

      <div class="end"></div>
    `;
  }

});