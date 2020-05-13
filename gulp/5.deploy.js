const gulp = require('gulp');
const ghPages = require('gulp-gh-pages');

gulp.task('github', function() {
  return gulp.src('./dist/**/*')
    .pipe(ghPages());
});

gulp.task('deploy', gulp.series(['copy', 'github']));