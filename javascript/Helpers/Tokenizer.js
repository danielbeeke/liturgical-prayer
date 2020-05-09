import {BibleTokenizer} from './BibleTokenizer.js';

export class Tokenizer {

  constructor() {
    this.modules = {
      'bible': new BibleTokenizer()
    };
  }

  replace (content) {

    let matches = content.matchAll('^\\[([a-zA-Z]*):(.*)\\]$');

    for (let match of matches) {
      let tokenModule = match[1];
      let parameter = match[2];

      if (this.modules[tokenModule]) {
        content = this.modules[tokenModule].tokenize(parameter);
      }
    }

    return content;
  }

}