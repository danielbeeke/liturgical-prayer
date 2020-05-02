import {html} from '../vendor/lighterhtml.js';

export const Routes = {
  'pray': { template: html`<prayer-home class="page" /><prayer-menu />` },
  'settings': { template: html`<prayer-settings class="page" /><prayer-menu />` },
  'settings/:moment': { template: html`<prayer-moment-configure class="page" />` },
  'pray/:moment': { template: html`<prayer-pray class="page" /><prayer-menu />` },
  'settings/:moment/prayer-category/:category': { template: html`<prayer-category-details class="page" />` },
  'settings/:moment/create-free-category': { template: html`<prayer-create-free-category class="page" />` },
};
