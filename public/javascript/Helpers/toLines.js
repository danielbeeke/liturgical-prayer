import {html} from 'https://cdn.skypack.dev/uhtml/async'

export let toLines = (content) => {
  if (typeof content === 'object') {
    return content;
  }

  return content.toString().replace(/(?:\r\n|\r|\n)/g, 'NEWLINE').split('NEWLINE').map(line => html`${line}<br />`)
};