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
    let s = Store.getState().schedule;
    this.categoryExists = false;

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
      slug: '_other_'
    }];

    this.existingCategories = [
      ...s.freeCategories.map(freeCategory => freeCategory.slug),
      ...prayerData['Categories'].map(prayerCategory => Slugify(prayerCategory.Title))
    ];

    this.suggestions = this.suggestions.filter(suggestion => !this.existingCategories.includes(suggestion.slug))
  }

  createCategory () {
    let s = Store.getState().schedule;
    let moment = s.moments.find(moment => moment.slug === this.route.parameters.moment);
    let selectedSuggestion = this.suggestions.find(suggestion => suggestion.slug === this.selected);

    return this.selected === '_other_' ? {
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
  }

  saveCategory () {
    let category = this.createCategory();
    if (!this.existingCategories.includes(category.slug)) {
      createFreeCategory(this.route.parameters.moment, category);
      this.root.router.navigate(`/settings/${this.route.parameters.moment}`);
    }
  }

  validate () {
    let category = this.createCategory();
    this.categoryExists = this.existingCategories.includes(category.slug);
    this.draw();
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
    ${this.selected === '_other_' ? html`
      <label>${t.direct('Title')}</label>
      <input type="text" onkeyup="${event => {this.otherText = event.target.value; this.validate()}}">
    ` : html``}
    </div>
    
    ${this.categoryExists ? html`
    <span>${t`The category already exists`}</span>
    ` : html`
    <button class="button" onclick="${() => this.saveCategory()}">${t.direct('Save')}</button>
    `}
    `;
  }
});