let postcss = require('postcss');
let DatauriParser = require('datauri/parser');

let functions = {
  getFontPreset: function (localOptions, name) {
    return localOptions.presets && localOptions.presets[name];
  },

  roundToNumber: function (valueToRound, roundTo) {
    return Math.round(valueToRound / roundTo) * roundTo;
  },

  ceilToNumber: function (valueToCeil, ceilTo) {
    return Math.ceil(valueToCeil / ceilTo) * ceilTo;
  },

  getPixelValueFromCssProperty: function (properties) {
    let width = false;
    let propertiesSplit = properties.split(' ');

    propertiesSplit.forEach((property) => {
      if (parseInt(property)) {
        if (width) {
          throw new Error('This function does not know how to deal with multiple pixel values in a css property value.');
        }
        width = parseInt(property);
      }
    });

    return width;
  },

  applyRs: function (declaration, localDocumentRowSize) {
    if (declaration.value.indexOf('rs') !== -1) {
      let regexp = new RegExp('(\\d*\\.?\\d+)rs', 'gi');

      declaration.value = declaration.value.replace(regexp, function ($1) {
        return parseFloat($1) * localDocumentRowSize + 'px';
      });
    }
  },

  applyFontProperties: function (rule, declaration, fontPreset, localDocumentRowSize) {
    let propertiesToSkip = ['rows', 'base-line-percentage'];

    Object.keys(fontPreset).forEach((property) => {
      if (propertiesToSkip.indexOf(property) === -1) {
        rule.insertAfter(declaration, postcss.parse(property + ': ' + fontPreset[property]));
      }
    });

    rule.insertAfter(declaration, postcss.parse('line-height: ' + localDocumentRowSize * fontPreset['rows'] + 'px'));
  },

  calculateTopCorrection: function (fontPreset, localDocumentRowSize) {
    let initialFontBase = ((localDocumentRowSize * fontPreset['rows']) / 2) + (parseFloat(fontPreset['base-line-percentage']) - 0.5) * parseInt(fontPreset['font-size']);
    let wantedFontSize = functions.roundToNumber(initialFontBase, localDocumentRowSize);
    let topCorrection = wantedFontSize - initialFontBase;

    if (topCorrection < localDocumentRowSize) {
      topCorrection = topCorrection + localDocumentRowSize;
    }

    return topCorrection;
  },

  subtractBorder: function (rule, paddingCorrection, localDocumentRowSize, type) {
    rule.walkDecls(function (possibleBorder) {
      if (possibleBorder.prop === 'border') {
        let allBorderWidth = functions.getPixelValueFromCssProperty(possibleBorder.value);
        if (allBorderWidth) {
          paddingCorrection = paddingCorrection - allBorderWidth;
        }
      }

      if (possibleBorder.prop === 'border-' + type) {
        let borderTopWidth = functions.getPixelValueFromCssProperty(possibleBorder.value);
        if (borderTopWidth) {
          paddingCorrection = paddingCorrection - borderTopWidth;
        }
      }
    });

    if (paddingCorrection < 0) {
      paddingCorrection = paddingCorrection + localDocumentRowSize;
    }

    return paddingCorrection;
  },

  subtractBorderTop: function (rule, paddingTopCorrection, localDocumentRowSize) {
    return functions.subtractBorder(rule, paddingTopCorrection, localDocumentRowSize, 'top');
  },

  subtractBorderBottom: function (rule, paddingBottomCorrection, localDocumentRowSize) {
    return functions.subtractBorder(rule, paddingBottomCorrection, localDocumentRowSize, 'bottom');
  },

  paddingOrMarginToLongHand: function (value) {
    let valueSplit = value.split(' ');

    if (valueSplit.length === 1) {
      return {
        top: value,
        right: value,
        bottom: value,
        left: value
      }
    }

    if (valueSplit.length === 2) {
      return {
        top: valueSplit[0],
        right: valueSplit[1],
        bottom: valueSplit[0],
        left: valueSplit[1]
      }
    }

    if (valueSplit.length === 3) {
      return {
        top: valueSplit[0],
        right: valueSplit[1],
        bottom: valueSplit[2],
        left: valueSplit[1]
      }
    }

    if (valueSplit.length === 4) {
      return {
        top: valueSplit[0],
        right: valueSplit[1],
        bottom: valueSplit[2],
        left: valueSplit[3]
      }
    }
  },

  fixPadding: function (rule, declaration, paddingTopCorrection, paddingBottomCorrection) {
    let paddingLongHand = {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    };

    rule.walkDecls(function (possiblePadding) {
      if (possiblePadding.prop === 'padding') {
        paddingLongHand = functions.paddingOrMarginToLongHand(possiblePadding.value);
        possiblePadding.remove();
      }

      if (possiblePadding.prop === 'padding-top') {
        paddingLongHand.top = parseInt(possiblePadding.value);
        possiblePadding.remove();
      }

      if (possiblePadding.prop === 'padding-bottom') {
        paddingLongHand.bottom = parseInt(possiblePadding.value);
        possiblePadding.remove();
      }
    });

    paddingTopCorrection = parseInt(paddingLongHand.top) + paddingTopCorrection;
    paddingBottomCorrection = parseInt(paddingLongHand.bottom) + paddingBottomCorrection;

    if (paddingTopCorrection) {
      rule.insertAfter(declaration, postcss.parse('padding-top: ' + paddingTopCorrection + 'px'));
    }

    if (paddingBottomCorrection) {
      rule.insertAfter(declaration, postcss.parse('padding-bottom: ' + paddingBottomCorrection + 'px'));
    }

    if (paddingLongHand.left) {
      rule.insertAfter(declaration, postcss.parse('padding-left: ' + paddingLongHand.left));
    }

    if (paddingLongHand.right) {
      rule.insertAfter(declaration, postcss.parse('padding-right: ' + paddingLongHand.right));
    }
  },

  applyGridHelper: function (rule, declaration, localDocumentRowSize) {
    if (declaration.prop === 'vertical-rhythm-grid') {
      let properties = declaration.value.split(' ');

      let firstRowOddColor = properties[0];
      let firstRowEvenColor = properties[1];

      let otherRowOddColor = properties[2];
      let otherRowEvenColor = properties[3];

      let horizontalWidth = properties[4];
      let alternation = properties[5];

      let oneLineWidth = parseInt(horizontalWidth);
      let svgWidth = oneLineWidth * 2;
      let svgHeight = alternation * localDocumentRowSize;


      let svgStart = '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="' + svgWidth  + '" height="' + svgHeight + '" viewBox="0 0 ' + svgWidth  + ' ' + svgHeight + '">';

      let svgMiddle = '';

      for (i = 0; i < alternation; i++) {
        let rowOddColor = i === 0 ? firstRowOddColor : otherRowOddColor;
        let rowEvenColor = i === 0 ? firstRowEvenColor : otherRowEvenColor;
        let y = i * localDocumentRowSize;

        svgMiddle += '<rect width="' + oneLineWidth + '" height="1" x="0" y="' + y + '" fill="' + rowOddColor + '"/><rect width="' + oneLineWidth + '" height="1" x="' + oneLineWidth + '" y="' + y + '" fill="' + rowEvenColor + '"/>';
      }

      let svgEnd = '</svg>';

      let svg = svgStart + svgMiddle + svgEnd;

      const datauri = new DatauriParser();
      datauri.format('.svg', svg);

      declaration.remove();

      rule.insertAfter(declaration, postcss.parse('background-image:  url("' + datauri.content + '")'));
    }
  },

  purgeCache: function (moduleName) {
    // Traverse the cache looking for the files
    // loaded by the specified module name
    functions.searchCache(moduleName, function (mod) {
      delete require.cache[mod.id];
    });

    // Remove cached paths to the module.
    // Thanks to @bentael for pointing this out.
    Object.keys(module.constructor._pathCache).forEach(function(cacheKey) {
      if (cacheKey.indexOf(moduleName)>0) {
        delete module.constructor._pathCache[cacheKey];
      }
    });
  },

  searchCache: function (moduleName, callback) {
    // Resolve the module identified by the specified name
    let mod = require.resolve(moduleName);

    // Check if the module has been resolved and found within
    // the cache
    if (mod && ((mod = require.cache[mod]) !== undefined)) {
      // Recursively go over the results
      (function traverse(mod) {
        // Go over each of the module's children and
        // traverse them
        mod.children.forEach(function (child) {
          traverse(child);
        });

        // Call the specified callback providing the
        // found cached module
        callback(mod);
      }(mod));
    }
  }
};

module.exports = functions;