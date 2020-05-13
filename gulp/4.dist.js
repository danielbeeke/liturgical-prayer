'use strict';

const gulp = require('gulp');
const clean = require('gulp-clean');
const rename = require('gulp-rename');

gulp.task('clean', () => {
  return gulp.src(['dist/*']).pipe(clean({read: false}));
});

gulp.task('copy-dist', () => {
  return gulp.src(['public/**/*']).pipe(gulp.dest('dist'));
});

gulp.task('create-404', () => {
  return gulp.src(['public/index.html'])
  .pipe(rename('404.html'))
  .pipe(gulp.dest('dist'));
});

gulp.task('copy', gulp.series(['clean', 'copy-dist', 'create-404']));