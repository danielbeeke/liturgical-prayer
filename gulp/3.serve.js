'use strict';

const gulp = require('gulp');
const fs = require('fs');
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
      port: folder === 'public' ? 4443 : 4444,
      middleware: function(req, res, next) {
        let url = req.url;

        if (!url.includes('.')) {
          if (fs.existsSync(folder + '/' + req.url + '.html')) {
            req.url += '.html';
          }
          else {
            req.url = '/index.html'
          }
        }

        if (url === '/') {
          req.url = '/index.html'
        }

        return next();
      },
      server: folder === 'public' ? [folder, './'] : [folder],
      snippetOptions: {
        rule: {
          match: /<!--  SNIPPET  -->/i,
          fn: function (snippet, match) {
            return (folder === 'public' ? snippet + `<script type="module" src="/hmr-client.js"></script>` + match : ' ');
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
