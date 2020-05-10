'use strict';

const gulp = require('gulp');
const fs = require('fs');
const fetch = require('node-fetch');
const settings = require('../settings.json');

const url = (tab) => `https://spreadsheets.google.com/feeds/cells/18qkOV9qO0B5WyKn99L2S2Aa8O6DMy839ABvpWnrGl6o/${tab}/public/values?alt=json`;

let convertToObject = (data) => {
  let title = data.feed.title.$t;

  if (title.substr(0, 1) === '#') return;

  let rows = [];
  data.feed.entry.forEach(row => {
    if (!rows[row.gs$cell.row - 1]) rows.push([]);
    let currentRow = rows[row.gs$cell.row - 1];
    currentRow[parseInt(row.gs$cell.col)] = row.gs$cell.$t;
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

  return {
    data: objects,
    title: title
  }
};

let fetchBibles = async () => {
  let response = await fetch('https://api.scripture.api.bible/v1/bibles', {
    headers: {
      'api-key': settings.bible_token
    }
  });

  let json = await response.json();
  return json.data.filter(bible => [
    'de4e12af7f28f599-02',
    '9879dbb7cfe39e4d-04'
  ].includes(bible.id));
};

let init = async () => {
  let pages = {};

  let bibles =  await fetchBibles();

    for (let bible of bibles) {
      let response = await fetch(`https://api.scripture.api.bible/v1/bibles/${bible.id}/books`, {
        headers: {
          'api-key': settings.bible_token
        }
      });
      let books = await response.json();
      bible.books = books.data;
    }

  pages['Bibles'] = bibles;

  let fetchPage = async (page) => {
    try {
      let response = await fetch(url(page));
      let json = await response.json();
      let item = convertToObject(json);
      pages[item.title] = item.data;
      page++;
    }
    catch (e) {
      console.log(e)
    }
  };

  // First get the index, it tells us how many pages to fetch.
  await fetchPage(1);
  let totalToFetch = pages['Categories'].length + 12;

  let page = 2;

  while (page && page <= totalToFetch) {
    try {
      let response = await fetch(url(page));
      let json = await response.json();
      let item = convertToObject(json);
      pages[item.title] = item.data;
      page++;
    }
    catch (e) {
      page = null;
    }
  }

  return pages;
};


gulp.task('content', async function (cb) {
  let pages = await init();
  fs.writeFile('public/javascript/Content.js', 'export const Content = ' + JSON.stringify(pages), function (err) {
    if (err) return console.log(err);
    cb();
  });
});


gulp.task('tokenize', async function (cb) {
  let content = fs.readFileSync('public/javascript/Content.js', 'utf8');
  content = content.replace('export const Content = ', '');
  let data = JSON.parse(content);
  for (let [name, page] of Object.entries(data)) {
    for (let row of page) {
      if (row.Content) {
        let matches = row.Content.matchAll('^\\[bible:(.*)\\]$');

        for (let match of matches) {
          let parameter = match[1];

          for (let bible of data['Bibles']) {
            let bookName = parameter.split(' ')[0];
            let chapterNumber = parameter.split(' ')[1];
            let book = bible.books.find(book => book.name === bookName);

            let queryString = new URLSearchParams();
            let queryArguments = {
              'content-type': 'text',
              'include-notes': false,
              'include-titles': true,
              'include-chapter-numbers': false,
              'include-verse-numbers': true,
              'include-verse-spans' : false
            };

            for (let [key, value] of Object.entries(queryArguments)) {
              queryString.append(key, value);
            }

            let url = `https://api.scripture.api.bible/v1/bibles/${bible.id}/chapters/${book.id + '.' + chapterNumber}`;
            let response = await fetch(url, {
              headers: {
                'api-key': settings.bible_token
              }
            });

            let chapters = await response.json();
            if (!book.chapters) {
              book.chapters = [];
            }
            book.chapters.push(chapters.data);
          }
        }
      }
    }

    fs.writeFile('public/javascript/Content.js', 'export const Content = ' + JSON.stringify(data), function (err) {
      if (err) return console.log(err);
      cb();
    });
  }
});