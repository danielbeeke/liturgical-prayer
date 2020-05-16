import {html} from '../vendor/uhtml.js';
import {Content} from '../Content.js';
import {Slugify} from '../Helpers/Slugify.js';

let pageRoutes = {};
Content.Pages.forEach(page => {
  page.slug = Slugify(page.Title);
  pageRoutes[page.slug] = { template: html`<prayer-page class="page hidden" />` };
});

export const Routes = {
  'pray': { template: html`<prayer-home class="page hidden" />` },
  'menu': { template: html`<prayer-main-menu class="page hidden" />` },
  'settings': { template: html`<prayer-settings class="page hidden" />` },
  'settings/:moment': { template: html`<prayer-moment-configure class="page hidden" />` },
  'pray/:moment': { template: html`<prayer-pray class="page hidden hide-menu" />` },
  'settings/:moment/prayer-category/:category': { template: html`<prayer-category-details class="page hidden" />` },
  'settings/:moment/prayer-category/:category/create': { template: html`<prayer-category-prayer-point-create class="page hidden" />` },
  'settings/:moment/prayer-category/:category/:item': { template: html`<prayer-category-prayer-point class="page hidden" />` },
  'settings/:moment/create-free-category': { template: html`<prayer-create-free-category class="page hidden" />` },
  ...pageRoutes
};
