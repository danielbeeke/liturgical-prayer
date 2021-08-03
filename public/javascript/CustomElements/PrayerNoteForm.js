import {BaseElement} from '../Core/BaseElement.js';
import {html} from 'https://cdn.skypack.dev/uhtml/async'
import {saveNote, deleteNote} from '../Actions/PrayActions.js';
import {Store} from '../Core/Store.js';

export class PrayerNoteForm extends BaseElement {

  constructor() {
    super();
    let p = Store.getState().pray;
    let currentDateObject = p.calendar.find(item => item.date === this.route.parameters.date);
    let noteExists = currentDateObject.notes[this.route.parameters.moment] && currentDateObject.notes[this.route.parameters.moment][this.route.parameters.category];
    this.existingNote = noteExists ? currentDateObject.notes[this.route.parameters.moment][this.route.parameters.category] : false;
    this.noteText = this.existingNote ? this.existingNote.note : '';
  }

  saveNote () {
    saveNote(
      this.route.parameters.moment,
      this.route.parameters.date,
      this.route.parameters.prayer,
      this.route.parameters.category,
      this.noteText
    );
    let query = (new URL(document.location)).searchParams;
    this.root.router.navigate(query.get('back'));
  }

  deleteNote () {
    deleteNote(
      this.route.parameters.moment,
      this.route.parameters.date,
      this.route.parameters.prayer,
      this.route.parameters.category,
    );
    let query = (new URL(document.location)).searchParams;
    this.root.router.navigate(query.get('back'));
  }

  draw() {
    let t = this.root.t;
    let query = (new URL(document.location)).searchParams;

    return html`
      <h3 class="page-title">
        <a class="back-button" href="${query.get('back')}"><prayer-icon name="arrow-left" /></a>
        ${this.existingNote ? t.direct('Update note') : t.direct('Add a note')}
      </h3>
      
      <div class="field">
        <label>${t.direct('Note')}</label>
        <div class="field-inner">
          <textarea onkeyup="${event => {this.noteText = event.target.value; this.draw()}}" .value="${this.noteText}"></textarea>
        </div>
      </div>      

      <div>
        <button class="${`button ${this.noteText.length === 0 ? 'disabled' : ''}`}" onclick="${() => this.saveNote()}">${t.direct('Save')}</button>        
        ${this.existingNote ? html`<button class="button danger" onclick="${() => this.deleteNote()}">${t.direct('Delete')}</button>` : ''}
      </div>
    `;
  }

}