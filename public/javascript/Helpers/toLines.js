export let toLines = (content) => {
  return content.toString().replace(/(?:\r\n|\r|\n)/g, 'NEWLINE').split('NEWLINE')
};