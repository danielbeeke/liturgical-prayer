import {BaseElement} from '../Core/BaseElement.js';
import {html} from '../vendor/uhtml.js';
import {daysInMonth} from '../Helpers/DaysInMonth.js';
import {Store} from '../Core/Store.js';

customElements.define('prayer-calendar', class PrayerHome extends BaseElement {

  constructor() {
    super();
    this.selectedDay = new Date();
  }

  draw () {
    let calendar = Store.getState().pray.calendar;
    let t = this.root.t;

    let month = this.selectedDay.getMonth();
    let year = this.selectedDay.getFullYear();

    let firstDayOfMonth = new Date(year, month, 1);

    let emptyDayCount = firstDayOfMonth.getDay();
    let emptyDays = [];
    for (let i = 0; i < emptyDayCount; i++) {
      emptyDays.push(i);
    }

    let monthLabel = new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(this.selectedDay);

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
    let numberCount = daysInMonth(month + 1, year);
    for (let i = 1; i <= numberCount; i++) {
      numberDays.push(i);
    }

    return html`
      <h2 class="page-title">
        <prayer-icon name="calendar" />
        ${t.direct(`Calendar`)}
      </h2>

      <div class="month-buttons">
        <button class="button secondary has-icon-left small" onclick="${() => {this.selectedDay.setMonth(this.selectedDay.getMonth() - 1); this.draw()}}">
          <prayer-icon name="arrow-left" />
          ${t.direct('Previous month')}
        </button>
        
        <button class="${'button secondary has-icon small'}" onclick="${() => {this.selectedDay.setMonth(this.selectedDay.getMonth() + 1); this.draw()}}">
          ${t.direct('Next month')}
          <prayer-icon name="arrow-right" />
        </button>      
      </div>
     
     <h2 class="calendar-title">${monthLabel}</h2>
     
      <div class="calendar">
        ${weekDays.map(day => html`<div class="day">${day.toString().substr(0, 1)}</div>`)}
        ${emptyDays.map(day => html`<div class="empty number"></div>`)}
        ${numberDays.map(day => {
          let hasPrayers = this.dayHasPrayers(calendar, day, month + 1, year);
          
            return hasPrayers ? html`<a href="${`/calendar/${year}-${month + 1}-${day}/detail`}" class="${'number has-prayers ' + (day === this.selectedDay.getDate() ? ' selected' : '')}">
            ${day}
          </a>` : html`<span class="${'number' + (day === this.selectedDay.getDate() ? ' selected' : '')}">${day}</span>`      
        })}
      </div>
      
      <div class="end"></div>
    `;
  }

  dayHasPrayers (calendar, day, month, year) {
    let dateString = `${year}-${month}-${day}`;
    return calendar.find(item => item.date === dateString);
  }

});