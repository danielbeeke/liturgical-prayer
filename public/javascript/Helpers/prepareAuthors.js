import {html} from 'https://cdn.skypack.dev/uhtml/async'

export const prepareAuthors = (authors) => authors?.map(author => {
  if (author.startsWith('http')) {
    const corsProxy = 'https://cors.mep/'
    const imageService = 'https://images.mep/'
    return fetch(corsProxy + author.replace('http://', '//'), {
      headers: {
        accept: 'application/ld+json'
      }
    })
    .then(response => response.json())
    .then(response => {
      const authorName = response['@graph'][0]['name']['@value']
      const depiction = response['@graph'][0]['depiction']
      const topic = response['@graph'][0]['isPrimaryTopicOf']
      
      return topic ? html`<a target="_blank" href=${topic} class=${`author ${depiction ? 'with-image' : ''}`}>
        ${depiction ? html`<img src=${`${imageService}?url=${corsProxy}${depiction}&width=60&height=60&fit=cover&a=attention`} />` : html`<prayer-icon name="author" />`}${authorName}
      </a>` : 
      html`<em class=${`author ${depiction ? 'with-image' : ''}`}>
        ${depiction ? html`<img src=${`${imageService}?url=${corsProxy}${depiction}&width=60&height=60&fit=cover&a=attention`} />` : html`<prayer-icon name="author" />`}${authorName}
      </em>`
    })
  }
  return html`<em class="author"><prayer-icon name="author" />${author}</em>`
}) ?? null