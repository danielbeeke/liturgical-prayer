import {BaseElement} from '../Core/BaseElement.js';
import {html} from '../vendor/uhtml.js';
import {daysInMonth} from '../Helpers/DaysInMonth.js';
import {Store} from '../Core/Store.js';

customElements.define('prayer-calendar', class PrayerHome extends BaseElement {

  draw () {
    let dateParts = this.route.parameters.date.split('-');
    this.year = parseInt(dateParts[0]);
    this.month = parseInt(dateParts[1]);
    this.day = dateParts[2];
    let dateString = `${this.year}-${this.month}-${this.day}`;

    let calendar = Store.getState().pray.calendar;
    this.selectedDayData = this.day ? calendar.find(item => item.date === dateString) : null;

    this.previousLink = `/calendar/${this.month === 1 ? this.year - 1 : this.year}-${this.month === 1 ? 12 : this.month - 1}`;
    this.nextLink = `/calendar/${this.month === 12 ? this.year + 1 : this.year}-${this.month === 12 ? 1 : this.month + 1}`;

    let t = this.root.t;
    let s = Store.getState().schedule;

    let firstDayOfMonth = new Date(this.year, this.month - 1, 1);

    let emptyDayCount = firstDayOfMonth.getDay();
    let emptyDays = [];
    for (let i = 0; i < emptyDayCount; i++) {
      emptyDays.push(i);
    }

    let dateOptions = {
      year: 'numeric',
      month: 'long',
    };

    let moments = null;

    if (this.day) {
      dateOptions.day = 'numeric';

      let {date, ...prayedMoments} = this.selectedDayData;
      let prayedMomentSlugs = Object.keys(prayedMoments);
      moments = html`${s.moments.filter(moment => prayedMomentSlugs.includes(moment.slug)).map(moment => html`
        <a class="moment card history" data-moment="${moment.slug}" href="${'/pray/' + moment.slug}" style="${`--color-primary: ${moment.color};  --color-secondary: ${moment.colorBackground}`}">
          <div class="image" style="${`background-image: url(${moment.background});`}"></div>
          <span class="button has-icon">
            ${t`Pray`}
            <prayer-icon name="arrow-right" />
          </span>
          <span class="title">${t.direct(moment.name)}</span>
        </a>
      `)}`;
    }

    let selectedDay = new Date(`${this.year}-${this.month}-${this.day ? this.day : 1}`);
    let monthLabel = new Intl.DateTimeFormat(undefined, dateOptions).format(selectedDay);

    const weekDays = [
      t.direct('Sunday'),
      t.direct('Monday'),
      t.direct('Tuesday'),
      t.direct('Wednesday'),
      t.direct('Thursday'),
      t.direct('Friday'),
      t.direct('Saterday'),
    ];

    let numberDays = [];
    let numberCount = daysInMonth(this.month - 1, this.year);
    for (let i = 1; i <= numberCount; i++) {
      numberDays.push(i);
    }

    let days = numberDays.map(day => {
      let hasPrayers = this.dayHasPrayers(calendar, day, this.month, this.year);
      return hasPrayers ? html`<a href="${`/calendar/${this.year}-${this.month}-${day}`}" class="${'number has-prayers'}">
        ${day}
      </a>` : html`<span class="${'number'}">${day}</span>`
    });

    let buttons = html`<div class="month-buttons">
      <a href="${this.previousLink}" class="button secondary only-icon">
        <prayer-icon name="arrow-left" />
      </a>
      
      <h2 class="calendar-title">${monthLabel}</h2>
      
      <a href="${this.nextLink}" class="${'button secondary only-icon'}">
        <prayer-icon name="arrow-right" />
      </a>      
    </div>`;

    return html`
      <h2 class="page-title">
        <prayer-icon name="calendar" />
        ${this.selectedDayData ? monthLabel : t.direct(`Calendar`)}
      </h2>

      ${this.selectedDayData ? html`
        <div class="line-calendar">${days}<div class="end"></div></div>
        <div class="line-moments">
            ${moments}
        </div>
      ` :
      html`${buttons}<div class="calendar">
        ${weekDays.map(day => html`<div class="day">${day.toString().substr(0, 1)}</div>`)}
        ${emptyDays.map(day => html`<div class="empty number"></div>`)}
        ${days}
      </div>`}
     
      <div class="end"></div>
    `;
  }

  dayHasPrayers (calendar, day, month, year) {
    let dateString = `${year}-${month}-${day}`;
    return calendar.find(item => item.date === dateString);
  }

  forceDraw() {
    this.draw();
  }

  afterDraw() {
    let activeDay = this.querySelector('.number.active');

    if (activeDay) {
      setTimeout(() => {
        activeDay.scrollIntoView({inline: 'center', behavior: 'smooth'});
      }, 300);
    }
  }

});