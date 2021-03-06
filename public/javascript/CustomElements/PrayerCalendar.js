import {BaseElement} from '../Core/BaseElement.js';
import {html} from '../vendor/uhtml.js';
import {daysInMonth} from '../Helpers/DaysInMonth.js';
import {Store} from '../Core/Store.js';

export class PrayerCalendar extends BaseElement {

  constructor() {
    super();
    this.selectedRowAdjustment = 0;

    /**
     * This triggers an initial ontransitionend.
     */
    setTimeout(() => {
      let calendar = this.querySelector('.calendar');
      let correctHeight = calendar.offsetHeight;
      calendar.style.height = parseInt(calendar.offsetHeight) - 1 + 'px';
      setTimeout(() => {
        calendar.style.height = correctHeight + 'px';
      }, 100);
    });
  }

  prepareData () {
    let dateParts = this.route.parameters.date.split('-');
    this.year = parseInt(dateParts[0]);
    this.month = parseInt(dateParts[1]);
    this.day = dateParts[2] ? parseInt(dateParts[2]) : null;
    this.dateString = `${this.year}-${this.month}-${this.day}`;

    if (!this.day) {
      this.selectedRowAdjustment = 0;
    }

    this.calendar = Store.getState().pray.calendar;
    this.selectedDayData = this.day ? this.calendar.find(item => item.date === this.dateString) : null;
    this.selectedRow = this.day ? Math.ceil((this.day + this.getEmptyDays().length) / 7) : 0;

    let isTablet = window.outerWidth > 700;
    this.classList[this.selectedDayData && !isTablet ? 'add' : 'remove']('hide-menu');
    this.classList[this.selectedDayData ? 'add' : 'remove']('has-selected-day');
  }

  getWeekDays () {
    let t = this.root.t;

    return [
      t.direct('Sunday'),
      t.direct('Monday'),
      t.direct('Tuesday'),
      t.direct('Wednesday'),
      t.direct('Thursday'),
      t.direct('Friday'),
      t.direct('Saterday'),
    ];
  }

  getEmptyDays () {
    let firstDayOfMonth = new Date(this.year, this.month - 1, 1);

    let emptyDayCount = firstDayOfMonth.getDay();
    let emptyDays = [];
    for (let i = 0; i < emptyDayCount; i++) {
      emptyDays.push(i);
    }

    return emptyDays;
  }

  getNumberDays () {
    let numberDays = [];
    let numberCount = daysInMonth(this.month, this.year);
    for (let i = 1; i <= numberCount; i++) {
      numberDays.push(i);
    }

    return numberDays.map(day => {
      let dateString = `${this.year}-${this.month}-${day}`;
      let calendarItem = this.calendar.find(item => item.date === dateString);
      let hasPrayers = !!calendarItem;

      let dayNotes = calendarItem && calendarItem.notes;
      let hasNotes = !!dayNotes;
      let noteCount = 0;
      if (hasNotes) {
        for (let [moment, categories] of Object.entries(dayNotes)) {
          noteCount += Object.keys(categories).length;
        }
      }

      let noteIndicators = [];
      for (let i = 0; i < noteCount; i++) {
        noteIndicators.push('');
      }

      if (hasPrayers) {
        return html`<a href="${`/calendar/${this.year}-${this.month}-${day}`}" class="${`number has-prayers no-page-transition ${hasNotes ? 'has-notes' : ''}`}">
          ${hasNotes ? html`<div class="note-indicators">
            ${noteIndicators.map(noteIndicator => html`<span class="note-indicator"></span>`)}
          </div>` : ''}
          ${day}
        </a>`;
      }
      else {
        return html`<span class="number">${day}</span>`
      }
    });
  }

  getMonthLabel () {
    let dateOptions = {
      year: 'numeric',
      month: 'numeric',
    };

    if (this.day) {
      dateOptions.day = 'numeric';
    }

    let selectedDay = new Date(`${this.year}-${this.month}-${this.day ? this.day : 1}`);
    return new Intl.DateTimeFormat(undefined, dateOptions).format(selectedDay);
  }

  next () {
    if (this.selectedDayData) {

      if (this.selectedRow + this.selectedRowAdjustment < this.maxRows()) {
        this.selectedRowAdjustment = this.selectedRowAdjustment + 1;
        this.draw();
      }
    }
    else {
      let link = `/calendar/${this.month === 12 ? this.year + 1 : this.year}-${this.month === 12 ? 1 : this.month + 1}`;
      this.root.router.navigate(link);
    }
  }

  previous () {
    if (this.selectedDayData) {
      if (this.selectedRow + this.selectedRowAdjustment > 1) {
        this.selectedRowAdjustment = this.selectedRowAdjustment - 1;
        this.draw();
      }
    }
    else {
      let link = `/calendar/${this.month === 1 ? this.year - 1 : this.year}-${this.month === 1 ? 12 : this.month - 1}`;
      this.root.router.navigate(link);
    }
  }

  maxRows () {
    let numberCount = daysInMonth(this.month, this.year);
    let firstDayOfMonth = new Date(this.year, this.month - 1, 1);
    return Math.ceil((numberCount + firstDayOfMonth.getDay()) / 7);
  }

  previousIsDisabled () {
    if (this.selectedDayData) {
      return (this.selectedRow + this.selectedRowAdjustment) === 1;
    }
    else {
      let firstDate = new Date(Object.values(this.calendar)[0].date);
      return this.month === firstDate.getMonth() + 1 && this.year === firstDate.getFullYear();
    }
  }

  nextIsDisabled () {
    if (this.selectedDayData) {
      return (this.selectedRow + this.selectedRowAdjustment) === this.maxRows();
    }
    else {
      let now = new Date();
      return this.month === now.getMonth() + 1 && this.year === now.getFullYear();
    }
  }

  draw () {
    this.prepareData();

    let {date, ...momentsData} = this.selectedDayData ? this.selectedDayData : {};

    return html`
      <prayer-main-menu />
      <div class="inner-page">
        <div class="header">
  
        <h2 class="page-title">
          <prayer-icon name="calendar" />
          ${this.getMonthLabel()}
        </h2>
  
        <button onclick="${() => this.previous()}" class="${`button secondary only-icon no-page-transition previous-month ${this.previousIsDisabled() ? ' disabled' : ''}`}">
          <prayer-icon name="arrow-left" />
        </button>
        
        <button onclick="${() => this.next()}" class="${`button secondary only-icon no-page-transition next-month ${this.nextIsDisabled() ? ' disabled' : ''}`}">
          <prayer-icon name="arrow-right" />
        </button>
  
        <button onclick="${() => this.goBack()}" class="button secondary only-icon no-page-transition back-to-month-view">
          <prayer-icon name="cross" />
        </button>
  
      </div>
        
        <div class="calendar" ontransitionend="${() => this.showPrayers()}" style="${`--selected-row: ${(this.selectedRow + this.selectedRowAdjustment).toString()};`}">
        <div class="inner">
            ${this.getWeekDays().map(day => html`<div class="day number">${day.toString().substr(0, 1)}</div>`)}
            ${this.getEmptyDays().map(day => html`<div class="empty number"></div>`)}
            ${this.getNumberDays()}  
        </div>
        </div>
        <div class="prayers-wrapper">
          ${this.selectedDayData ? html`<prayer-day-overview date="${this.route.parameters.date}" moment="${this.route.parameters.moment}" class="prayers hidden" />` : ''}
        </div>      
      </div>
    `;
  }

  goBack () {
    let prayers = this.querySelector('.prayers');
    let link = `/calendar/${this.year}-${this.month}`;

    let activeDay = this.querySelector('.number.active');
    activeDay.classList.remove('active');

    if (prayers) {
      prayers.addEventListener('transitionend', () => {
        this.root.router.navigate(link);
      }, { once: true });
      prayers.classList.add('hidden');
    }
    else {
      this.root.router.navigate(link);
    }
  }

  forceDraw() {
    this.draw();
  }

  afterDraw() {
    super.afterDraw();
    let prayers = this.querySelector('prayer-pray.hidden');
    if (prayers) {
      this.querySelector('.calendar').on
    }

    this.querySelector('a[href="/calendar"]').classList.add('active');
  }

  showPrayers () {
    let prayers = this.querySelector('.prayers.hidden');
    if (prayers) {
      requestAnimationFrame(() => {
        prayers.classList.remove('hidden');
      });
    }
  }

}