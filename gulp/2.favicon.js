'use strict';

const gulp = require('gulp');
const exec = require('child_process').exec;

gulp.task('favicon', function (cb) {
  exec('pwa-asset-generator public/images/logo.svg -i ./public/index.html -t png -m ./public/manifest.json ./public', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});