import {BaseElement} from '../Core/BaseElement.js';
import {Store} from '../Core/Store.js';
import {html, svg} from '../vendor/lighterhtml.js';
import {MinutesToHourDisplay} from '../Helpers/MinutesToHourDisplay.js';

customElements.define('prayer-schedule-widget', class PrayerScheduleWidget extends BaseElement {

  connectedCallback() {
    this.draw()
  }

  draw () {
    let prayerSchedule = Store.getState().prayerSchedule;

    let weekDays = [
      t('Sunday')`S`,
      t('Monday')`M`,
      t('Tuesday')`T`,
      t('Wednesday')`W`,
      t('Thursday')`T`,
      t('Friday')`F`,
      t('Saturday')`S`,
    ];

    let header = html`
      <div class="header">
        ${weekDays.map(weekDay => html`<span class="week-day-header">${weekDay}</span>`)}
      </div>
    `;

    let width = this.offsetWidth - 40;
    let height = this.offsetHeight - 30;

    let viewBox = `0 0 ${width} ${height}`;

    return html`
      ${header}
      ${svg`
        <svg viewBox="${viewBox}">
          <defs><pattern id="grid" width="${width / 7}" height="${height / 24}" patternUnits="userSpaceOnUse"><path d="M ${width / 7} 0 L 0 0 0 ${height / 24}" /></pattern></defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      `}
    `;
  }
});