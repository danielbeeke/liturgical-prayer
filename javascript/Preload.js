const url = (tab) => `https://spreadsheets.google.com/feeds/cells/18qkOV9qO0B5WyKn99L2S2Aa8O6DMy839ABvpWnrGl6o/${tab}/public/values?alt=json`;

export class PrayerData {

  constructor() {
    this.registerServiceWorker();
  }

  async init () {
    this.pages = {};
    let page = 1;
    while (page) {
      try {
        let response = await fetch(url(page));
        let json = await response.json();
        this.convertToObject(json);
        page++;
      }
      catch (e) {
        page = null;
      }
    }

    return this.pages;
  }

  convertToObject (data) {
    let title = data.feed.title.$t;

    if (title.substr(0, 1) === '#') return;

    let rows = [];
    data.feed.entry.forEach(row => {
      if (!rows[row.gs$cell.row - 1]) rows.push([]);
      let currentRow = rows[row.gs$cell.row - 1];
      currentRow.push(row.gs$cell.$t);
    });

    let keys = rows.shift();
    let objects = [];
    rows.forEach(row => {
      let object = {};
      keys.forEach((key, index) => {
        object[key] = row[index];
      });
      objects.push(object);
    });

    this.pages[title] = objects;
  }


  registerServiceWorker () {
    navigator.serviceWorker.register('/ServiceWorker.js', {scope: './'}).then(function() {
      if (navigator.serviceWorker.controller) {
        console.log('Service worker active');
      }
      else {
        console.log('Service worker inactive');
      }
    }).catch(function(error) {
      console.error(error);
    });
  }

}

let preload = new PrayerData();

preload.init().then(() => {
  window.prayerData = preload.pages;
  import('./App.js');
});