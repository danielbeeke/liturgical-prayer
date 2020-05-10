import {html} from '../vendor/uhtml.js';
import {Content} from '../Content.js';
import {Slugify} from '../Helpers/Slugify.js';

let pageRoutes = {};
Content.Pages.forEach(page => {
  page.slug = Slugify(page.Title);
  pageRoutes[page.slug] = { template: html`<prayer-page class="page hidden" /><prayer-menu />` };
});

export const Routes = {
  'pray': { template: html`<prayer-home class="page hidden" /><prayer-menu />` },
  'menu': { template: html`<prayer-main-menu class="page hidden" /><prayer-menu />` },
  'settings': { template: html`<prayer-settings class="page hidden" /><prayer-menu />` },
  'settings/:moment': { template: html`<prayer-moment-configure class="page hidden" /><prayer-menu />` },
  'pray/:moment': { template: html`<prayer-pray class="page hidden" />` },
  'settings/:moment/prayer-category/:category': { template: html`<prayer-category-details class="page hidden" /><prayer-menu />` },
  'settings/:moment/create-free-category': { template: html`<prayer-create-free-category class="page hidden" /><prayer-menu />` },
  ...pageRoutes
};
