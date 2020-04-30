const gulp = require('gulp');
const ava = require('gulp-ava');

gulp.task('test', function() {
  return gulp.src('public/javascript/**/*.test.js')
  .pipe(ava({verbose: true}))
});