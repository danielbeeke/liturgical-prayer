'use strict';

const gulp = require('gulp');

gulp.task('copy', () => {
  return gulp.src(['public/**/*']).pipe(gulp.dest('dist'));
});