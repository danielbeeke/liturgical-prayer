import {html} from 'https://cdn.skypack.dev/uhtml/async'
import {Content} from '../Content.js';
import {Slugify} from '../Helpers/Slugify.js';

let pageRoutes = {};

Content.Pages.forEach(page => {
  pageRoutes[page.slug] = { template: html`<prayer-page class="page hidden" />`, name: 'page' };
});

export const Routes = {
  'pray': { template: html`<prayer-home class="page hidden" />`, name: 'pray' },
  'calendar': { redirect: `/calendar/${(new Date()).getFullYear()}-${(new Date()).getMonth() + 1}`, name: 'calendar' },
  'calendar/:date': { template: html`<prayer-calendar class="page hidden" />`, name: 'calendar-details' },
  'prayer/:category/:prayer': { template: html`<prayer-prayer class="hide-menu page hidden" />`, name: 'prayer-detail' },
  'menu': { template: html`<prayer-main-menu class="page hidden" />`, name: 'menu' },
  'settings': { template: html`<prayer-settings class="page hidden" />`, name: 'settings' },
  'callback': { template: html`<prayer-storage-callback class="page hidden" />`, name: 'callback' },
  'settings/:moment': { template: html`<prayer-moment-configure class="page hidden" />`, name: 'settings-moment' },
  'pray/:moment': { template: html`<prayer-pray show-close-button class="page hidden hide-menu" />`, name: 'pray-moment' },
  'pray/:moment/:category': { template: html`<prayer-pray show-close-button class="page hidden hide-menu" />`, name: 'pray-moment-category' },
  'note/:moment/:category/:date/:prayer': { template: html`<prayer-note-form class="page hidden hide-menu" />`, name: 'note-form' },
  'settings/:moment/prayer-category/:category': { template: html`<prayer-category-details class="page hidden" />`, name: 'settings-moment-category' },
  'settings/:moment/prayer-category/:category/create': { template: html`<prayer-category-prayer-point-create class="page hidden" />`, name: 'settings-moment-create-item' },
  'settings/:moment/prayer-category/:category/:item': { template: html`<prayer-category-prayer-point class="page hidden" />`, name: 'settings-moment-edit-item' },
  'settings/:moment/create-free-category': { template: html`<prayer-create-free-category class="page hidden" />`, name: 'create-free-category' },
  ...pageRoutes
};
