'use strict';

const gulp = require('gulp');
const clean = require('gulp-clean');
const rename = require('gulp-rename');
const rollup = require('rollup');
const uglify = require('rollup-plugin-uglify');

gulp.task('clean', () => {
  return gulp.src(['dist/*']).pipe(clean({read: false}));
});

gulp.task('copy-dist', () => {
  return gulp.src(['public/**/*', '!public/javascript/**/*']).pipe(gulp.dest('dist'));
});

gulp.task('create-404', () => {
  return gulp.src(['public/index.html'])
  .pipe(rename('404.html'))
  .pipe(gulp.dest('dist'));
});


gulp.task('rollup', () => {
  return rollup.rollup({
    input: './public/javascript/App.js',
    plugins: [
      uglify
    ]
  }).then(bundle => {
    return bundle.write({
      file: './dist/javascript/App.js',
      format: 'es',
      sourcemap: false
    });
  });
});




gulp.task('copy', gulp.series(['clean', 'copy-dist', 'create-404', 'rollup']));