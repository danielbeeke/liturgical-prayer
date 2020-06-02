let settings = {
  "id": "backstop_default",
  "viewports": [
    {
      "label": "iphone",
      "width": 375,
      "height": 667
    },
    {
      "label": "tablet",
      "width": 1024,
      "height": 768
    }
  ],
  "onBeforeScript": "puppet/onBefore.js",
  "onReadyScript": "puppet/onReady.js",
  "scenarios": [],
  "paths": {
    "bitmaps_reference": "backstop_data/bitmaps_reference",
    "bitmaps_test": "backstop_data/bitmaps_test",
    "engine_scripts": "backstop_data/engine_scripts",
    "html_report": "backstop_data/html_report",
    "ci_report": "backstop_data/ci_report"
  },
  "report": ["browser"],
  "engine": "puppeteer",
  "engineOptions": {
    "args": ["--no-sandbox"]
  },
  "asyncCaptureLimit": 5,
  "asyncCompareLimit": 50,
  "debug": false,
  "debugWindow": false
};

let tests = {
  "/pray": 'Home',
  '/settings': 'Settings',
  '/how-to-use-this-app': 'About',
  '/settings/morning': 'Morning settings',
  '/settings/morning/create-free-category': 'Create free category',
  '/settings/morning/prayer-category/morning-prayer': 'Info'
};

for (let [path, label] of Object.entries(tests)) {
  settings.scenarios.push({
    "label": label,
    "url": 'https://localhost:4443/' + path,
    "readyEvent": "done",
  });
}

module.exports = settings;