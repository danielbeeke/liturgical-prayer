import {BaseElement} from '../Core/BaseElement.js';
import {html} from '../vendor/uhtml.js';

customElements.define('prayer-add-note', class PrayerIcon extends BaseElement {

  constructor() {
    super();
    this.showNotePanel = false;
    this.noteText = '';
  }

  saveNote () {

  }

  toggle () {
    this.showNotePanel = !this.showNotePanel;

    if (this.showNotePanel) {
      this.querySelector('.add-note-panel').addEventListener('transitionend', () => {
        this.querySelector('.add-note-panel').scrollIntoView({
          behavior: 'smooth'
        });
      }, { once: true });
    }

    this.draw();
  }

  draw() {
    let t = this.root.t;

    return html`

    <button class="${`add-note-button` + (this.showNotePanel ? ' opened' : '')}" onclick="${() => this.toggle()}">
        <prayer-icon name="${this.showNotePanel ? 'cross' : 'note-add'}" />
    </button>

    <div class="${`add-note-panel ` + (!this.showNotePanel ? ' hidden' : '')}">
      <h3 class="page-title">
        ${t.direct('Add a note')}
      </h3>
      
      <div class="field">
        <label>${t.direct('Note')}</label>
        <div class="field-inner">
          <textarea onchange="${event => this.noteText = event.target.value}" .value="${this.noteText}"></textarea>
        </div>
      </div>      

      <div>
        <button class="button" onclick="${() => this.saveNote()}">${t.direct('Save')}</button>        
      </div>

      
    </div>

    `;
  }

});
