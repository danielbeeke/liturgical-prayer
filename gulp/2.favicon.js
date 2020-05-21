'use strict';

const gulp = require('gulp');
const webshot = require('gulp-webshot');

gulp.task('favicon', function() {
  return gulp.src('./public/favicon.html')
  .pipe(webshot({ dest: 'public/favicon/', root:'public' }));
});

// const sizes = [
//   { name: 'favicon-16', size: '16/16' },
//   { name: 'favicon-32', size: '32/32' },
//   { name: 'apple-icon-180', size: '180/180' },
//   { name: 'pwa-icon-192', size: '192/192' },
//   { name: 'pwa-icon-512', size: '512/512' },
//   { name: 'apple-splash-640', size: '640/1136' },
//   { name: 'apple-splash-750', size: '750/1334' },
//   { name: 'apple-splash-1242', size: '1242/2208' },
//   { name: 'apple-splash-1125', size: '1125/2436' },
//   { name: 'apple-splash-1125', size: '1125/2436' },
//   { name: 'apple-splash-1536', size: '1536/2048' },
//   { name: 'apple-splash-1668', size: '1668/2224' },
//   { name: 'apple-splash-2048', size: '2048/2732' },
// ];
//
// sizes.map(item => {
//   exec(util.format(
//     'npx webshot --window-size=%s ./favicon.html ./public/favicon/%s.png',
//     item.size,
//     item.name
//   ))
// });
