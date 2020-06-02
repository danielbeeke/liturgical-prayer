const puppeteer = require('puppeteer');
const fs = require('fs');

async function ssr(url) {
  const browser = await puppeteer.launch({
    headless: true,
    ignoreHTTPSErrors: true
  });
  const page = await browser.newPage();
  await page.goto(url, {waitUntil: 'networkidle0'});
  const html = await page.content();
  await browser.close();
  return html;
}

let urls = [
  'pray',
  'menu',
  'settings'
];

(async function () {
  for (let url of urls) {
    const html = await ssr('https://localhost:4444/' + url);
    fs.writeFileSync('./public/' + url + '.html', html);
  }
})();