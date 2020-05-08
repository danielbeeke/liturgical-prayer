import {html} from '../vendor/uhtml.js';

export const Routes = {
  'pray': { template: html`<prayer-home class="page hidden" /><prayer-menu />` },
  'about': { template: html`<prayer-about class="page hidden" /><prayer-menu />` },
  'settings': { template: html`<prayer-settings class="page hidden" /><prayer-menu />` },
  'settings/:moment': { template: html`<prayer-moment-configure class="page hidden" /><prayer-menu />` },
  'pray/:moment': { template: html`<prayer-pray class="page hidden" />` },
  'settings/:moment/prayer-category/:category': { template: html`<prayer-category-details class="page hidden" /><prayer-menu />` },
  'settings/:moment/create-free-category': { template: html`<prayer-create-free-category class="page hidden" /><prayer-menu />` },
};
