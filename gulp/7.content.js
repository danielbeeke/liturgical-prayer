'use strict';

const gulp = require('gulp');
const fs = require('fs');
const fetch = require('node-fetch');

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

let init = async () => {
  let pages = {};

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
  let totalToFetch = pages['Categories'].length + 3;

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