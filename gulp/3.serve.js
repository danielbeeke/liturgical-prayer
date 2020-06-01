'use strict';

const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const EsmHmrEngine = require('./hmr-server.js');
const through = require('through2');
global.reload = browserSync.reload;
global.stream = browserSync.stream;

process.setMaxListeners(0);

['dist', 'public'].forEach(folder => {
  gulp.task('browsersync:' + folder, () => {
    const hmr = new EsmHmrEngine();

    browserSync.init({
      port: 4443,
      single: true,
      server: [folder, './'],
      snippetOptions: {
        rule: {
          match: /<!--  SNIPPET  -->/i,
          fn: function (snippet, match) {
            return snippet + `<script type="module" src="/hmr-client.js"></script>` + match;
          }
        }
      },
      https: {
        key: "certs/localhost.key",
        cert: "certs/localhost.crt"
      },
      ghostMode: false,
    });

    if (folder === 'public') {
      let dir = __dirname.replace('/gulp', '');
      gulp.src(['public/javascript/**/*']).pipe(through.obj(function (file, enc, cb) {

        let fileName = file.path.replace(dir + '/public', '');
        hmr.createEntry(fileName);
        cb(null);
      }));

      gulp.watch(['public/javascript/**/*']).on('change', (fileName) => {
        let isHotReloadable = fileName.includes('CustomElements');
        let url = fileName.replace('public/', '/');
        hmr.setEntry(url, [], isHotReloadable);
        isHotReloadable ? hmr.broadcastMessage({type: 'update', url}) : hmr.broadcastMessage({type: 'reload'});
      });
      gulp.watch('scss/**/*', gulp.series('css'));
      gulp.watch('font-presets.json', gulp.series('css'));
    }
  });
});

gulp.task('serve', gulp.series('css', 'browsersync:public'));
gulp.task('serve:dist', gulp.series('css', 'browsersync:dist'));
