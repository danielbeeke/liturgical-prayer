let postcss = require('postcss');
let functions = require('./rhythmmeister.functions.js');

module.exports = {
  processor: postcss.plugin('rhythmmeister', function (options) {
    options = options || {};
    let documentRowSize = parseInt(options['document-row-size']);

    return function (css) {
      css.walkRules(function (rule) {
        rule.walkDecls(function (declaration, i) {
          functions.applyRs(declaration, documentRowSize);
          functions.applyGridHelper(rule, declaration, documentRowSize);
        });
      });

      css.walkRules(function (rule) {
        rule.walkDecls(function (declaration, i) {
          if (declaration.prop === 'font-preset' && functions.getFontPreset(options, declaration.value)) {
            let fontPreset = functions.getFontPreset(options, declaration.value);
            functions.applyFontProperties(rule, declaration, fontPreset, documentRowSize);

            let paddingTopCorrection = functions.calculateTopCorrection(fontPreset, documentRowSize);
            let paddingBottomCorrection = documentRowSize - paddingTopCorrection;

            paddingTopCorrection = functions.subtractBorderTop(rule, paddingTopCorrection, documentRowSize);
            paddingBottomCorrection = functions.subtractBorderBottom(rule, paddingBottomCorrection, documentRowSize);

            functions.fixPadding(rule, declaration, Math.round(paddingTopCorrection), Math.round(paddingBottomCorrection));
          }
        })
      })
    }
  }),

  load: function (moduleName) {
    functions.purgeCache(moduleName);
    return require(moduleName);
  }
}