import {Content} from '../DataLoader.js';
import {Store} from '../Core/Store.js';
import {Hole} from '../vendor/uhtml.js';

export class BibleTokenizer {

  constructor() {
    this.cache = new Map();
  }

  tokenize (parameter) {
    if (this.cache.get(parameter)) {
      return this.cache.get(parameter);
    }
    else {
      return this.getBiblePart(parameter);
    }
  }

  getBiblePart (parameter) {
    let a = Store.getState().app;
    let selectedBible = Content.Bibles.find(bible => bible.id === a.bible);
    let bookName = parameter.split(' ')[0];
    let chapterNumber = parameter.split(' ')[1];
    let book = selectedBible.books.find(book => book.name === bookName);
    let identifier = `${book.id}.${chapterNumber}`;
    let chapter = book.chapters.find(chapter => chapter.id === identifier);
    return new Hole('html', ['<div class="scripture-styles">', chapter.content, '</div>'], []);
  }
}
