import {html} from '../vendor/uhtml.js';

export let toLines = (content) => {
  return content.toString().replace(/(?:\r\n|\r|\n)/g, 'NEWLINE').split('NEWLINE').map(line => html`${line}<br />`)
};