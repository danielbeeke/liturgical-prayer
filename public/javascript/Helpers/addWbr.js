import {html} from 'https://cdn.skypack.dev/uhtml/async'

export let addWbr = (string) => {
  let realString = string.toString();
  let split = realString.split(/[/]+/);
  return html`${
    split.map((part, index) => index !== split.length - 1 && split.length > 1 ? html`${part}/<wbr>` : html`${part}`)
  }`;
};