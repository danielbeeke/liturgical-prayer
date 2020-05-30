import {BaseElement} from '../Core/BaseElement.js';
import {html} from '../vendor/uhtml.js';
import {saveNote} from '../Actions/PrayActions.js';

export class PrayerAddNote extends BaseElement {

  constructor() {
    super();
    this.noteText = '';
  }

  saveNote () {
    saveNote(
      this.getAttribute('moment'),
      this.getAttribute('date'),
      this.getAttribute('prayer'),
      this.getAttribute('category'),
      this.noteText
    );
  }

  draw() {
    let t = this.root.t;
    let query = (new URL(document.location)).searchParams;

    return html`
      <h3 class="page-title">
        <a class="back-button" href="${query.get('back')}"><prayer-icon name="arrow-left" /></a>
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
    `;
  }

}