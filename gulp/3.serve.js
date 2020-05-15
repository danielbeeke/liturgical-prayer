'use strict';

const gulp = require('gulp');
const browserSync = require('browser-sync').create();
global.reload = browserSync.reload;
global.stream = browserSync.stream;

process.setMaxListeners(0);

['dist', 'public'].forEach(folder => {
  gulp.task('browsersync:' + folder, () => {
    browserSync.init({
      port: 4443,
      single: true,
      server: {
        baseDir: folder,
      },
      https: {
        key: "certs/localhost.key",
        cert: "certs/localhost.crt"
      },
      ghostMode: false,
    });

    if (folder === 'public') {
      gulp.watch(['public/javascript/**/*']).on('change', reload);
      gulp.watch('scss/**/*', gulp.series('css'));
      gulp.watch('font-presets.json', gulp.series('css'));
    }
  });
});

gulp.task('serve', gulp.series('css', 'browsersync:public'));
gulp.task('serve:dist', gulp.series('css', 'browsersync:dist'));
