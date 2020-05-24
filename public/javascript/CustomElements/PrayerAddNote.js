import {BaseElement} from '../Core/BaseElement.js';
import {html} from '../vendor/uhtml.js';

customElements.define('prayer-add-note', class PrayerIcon extends BaseElement {

  constructor() {
    super();
    this.showNotePanel = false;
  }

  draw() {
    let t = this.root.t;

    return html`
    <div class="${`add-note-panel ` + (!this.showNotePanel ? ' hidden' : '')}">
      <h3 class="page-title">
        ${t.direct('Add a note')}
        <a class="close-note-add" onclick="${() => {this.showNotePanel = !this.showNotePanel; this.draw()}}">
            <prayer-icon name="cross" />
      </a>
      </h3>
    </div>

    <button class="add-note-button" onclick="${() => {this.showNotePanel = !this.showNotePanel; this.draw()}}">
        <prayer-icon name="note-add" />
    </button>
    `;
  }

});
