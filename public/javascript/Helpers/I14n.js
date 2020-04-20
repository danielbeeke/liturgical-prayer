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
      valueString = asCodeString ? '${{' + keys[0] + '}}' : b[part][keys[0]];
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
  if (language !== 'English') {
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
      return strings => {
        let translatedText = I14n(strings);
        translatedText.context = context;
        return translatedText;
      }
    }
    else {
      let stringsToTranslate = context;
      let codeString = mixString(stringsToTranslate, values, true);

      if (typeof translations[codeString] !== 'undefined') {
        let translatedString = translations[codeString];

        let tokens = translations[codeString].match(/\$\{\{.*}}/);

        tokens.forEach(token => {
          translatedString = translatedString.replace(token, '[SPLIT]');
        });

        stringsToTranslate = translatedString.split('[SPLIT]');
        console.log(stringsToTranslate)
      }

      return new TranslatedText(mixString(stringsToTranslate, values));
    }
  }
}

