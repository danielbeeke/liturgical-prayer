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
  'calendar': { redirect: `/calendar/${(new Date()).getFullYear()}-${(new Date()).getMonth() + 1}` },
  'calendar/:date': { template: html`<prayer-calendar class="page hidden" />` },
  'prayer/:category/:prayer': { template: html`<prayer-prayer class="hide-menu page hidden" />` },
  'menu': { template: html`<prayer-main-menu class="page hidden" />` },
  'settings': { template: html`<prayer-settings class="page hidden" />` },
  'callback': { template: html`<prayer-storage-callback class="page hidden" />` },
  'settings/:moment': { template: html`<prayer-moment-configure class="page hidden" />` },
  'pray/:moment': { template: html`<prayer-pray show-close-button class="page hidden hide-menu" />` },
  'pray/:moment/:category': { template: html`<prayer-pray show-close-button class="page hidden hide-menu" />` },
  'note/:moment/:category/:date/:prayer': { template: html`<prayer-note-form class="page hidden hide-menu" />` },
  'settings/:moment/prayer-category/:category': { template: html`<prayer-category-details class="page hidden" />` },
  'settings/:moment/prayer-category/:category/create': { template: html`<prayer-category-prayer-point-create class="page hidden" />` },
  'settings/:moment/prayer-category/:category/:item': { template: html`<prayer-category-prayer-point class="page hidden" />` },
  'settings/:moment/create-free-category': { template: html`<prayer-create-free-category class="page hidden" />` },
  ...pageRoutes
};
