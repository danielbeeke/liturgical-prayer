import {BaseElement} from '../Core/BaseElement.js';
import {html} from '../vendor/lighterhtml.js';
import {Slugify} from '../Helpers/Slugify.js';
import {createFreeCategory} from '../Actions/ScheduleActions.js';
import {Store} from '../Core/Store.js';

customElements.define('prayer-create-free-category', class PrayerCreateFreeCategory extends BaseElement {

  constructor() {
    super();
    let t = this.root.t;
    this.selected = '';
    this.otherText = '';

    this.suggestions = [{
      Title: t.direct('- Select -'),
      Description: '',
      slug: ''
    }, ...prayerData['Suggestions'].map(suggestion => {
      return Object.assign(suggestion, {
        slug: Slugify(suggestion.Title)
      })
    }), {
      Title: t.direct('Other...'),
      Description: '',
      slug: 'other'
    }];

  }

  createCategory () {
    let s = Store.getState().schedule;
    let moment = s.moments.find(moment => moment.slug === this.route.parameters.moment);
    let selectedSuggestion = this.suggestions.find(suggestion => suggestion.slug === this.selected);

    let category = this.selected === 'other' ? {
      name: this.otherText,
      enabled: true,
      isFreeForm: true,
      description: '',
      items: [],
      order: moment.prayerCategories.length,
      slug: Slugify(this.otherText)
    } : {
      name: selectedSuggestion.Title,
      enabled: true,
      description: selectedSuggestion.Description,
      items: [],
      isFreeForm: true,
      order: moment.prayerCategories.length,
      slug: Slugify(selectedSuggestion.Title)
    };

    createFreeCategory(this.route.parameters.moment, category);
    this.root.router.navigate(`/settings/${this.route.parameters.moment}`);
  }

  draw () {
    let t = this.root.t;

    return html`
    <h2>${t.direct('Create category')}</h2>
          <a class="button" href="/settings/${this.route.parameters.moment}">${t.direct('Back')}</a>

    <div class="field">
    <label>${t.direct('Title')}</label>
    <select onchange="${event => {this.selected = event.target.value; this.draw()}}">
        ${this.suggestions.map(suggestion => html`
          <option value="${suggestion.slug}">${suggestion.Title}</option>
        `)}
    </select>
    </div>
    
    <div class="field">
    ${this.selected === 'other' ? html`
      <label>${t.direct('Title')}</label>
      <input type="text" onchange="${event => this.otherText = event.target.value}">
    ` : html``}
    </div>
    
    <button class="button" onclick="${() => this.createCategory()}">${t.direct('Save')}</button>
    `;
  }
});