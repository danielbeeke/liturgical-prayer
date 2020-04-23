class TranslatedText {
  constructor(text, context) {
    this.text = text;
    this.context = context;
  }

  toString () {
    return this.text;
  }
}

function mixString (a, b, asCodeString) {
  let total = Math.max(a.length, b.length);
  let string = '';

  for (let part = 0; part < total; part++) {
    let valueString = '';
    if (typeof b[part] === 'object') {
      let keys = Object.keys(b[part]);
      valueString = asCodeString ? '{' + keys[0] + '}' : b[part][keys[0]];
    }
    else if (typeof b[part] === 'string') {
      valueString = b[part];
    }

    string += a[part] + valueString;
  }

  return string;
}

export async function I14n (language) {
  let translations = {};
  if (['Dutch'].includes(language)) {
    translations = (await import(`../Translations/${language}.js`)).Translations;
  }

  /**
   *
   * @param context
   * @param values
   * @returns {TranslatedText}
   * @constructor
   */
  return function Translate (context, ...values) {
    if (typeof context === 'string') {
      return (strings, ...values) => {
        let translatedText = Translate(strings, ...values);
        translatedText.context = context;
        return translatedText;
      }
    }
    else {
      let stringsToTranslate = context;
      let codeString = mixString(stringsToTranslate, values, true);

      /**
       * Translation is not available.
       */
      if (typeof translations[codeString] === 'undefined') {
        return new TranslatedText(mixString(stringsToTranslate, values));
      }

      /**
       * We have a translation. Fill in the tokens.
       */
      else {
        let translatedString = translations[codeString];
        let tokens = Object.assign({}, ...values);

        let replacements = translatedString.match(/\{[a-zA-Z]*}/g);
        replacements.forEach(replacement => {
          let variableName = replacement.substr(1).substr(0, replacement.length - 2);
          translatedString = translatedString.replace(replacement, tokens[variableName]);
        });

        return new TranslatedText(translatedString);
      }
    }
  }
}

