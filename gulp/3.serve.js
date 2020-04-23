'use strict';

const gulp = require('gulp');
const browserSync = require('browser-sync').create();
global.reload = browserSync.reload;
global.stream = browserSync.stream;

process.setMaxListeners(0);

gulp.task('browsersync', () => {

  browserSync.init({
    port: 4443,
    single: true,
    server: {
      baseDir: 'public',
    },
    https: {
      key: "certs/localhost.key",
      cert: "certs/localhost.crt"
    },
    ghostMode: false,
  });

  gulp.watch(['public/javascript/**/*']).on('change', reload);
  gulp.watch('scss/**/*', { usePolling: true }, gulp.series('css'));
});

gulp.task('serve', gulp.series('css', 'browsersync'));
