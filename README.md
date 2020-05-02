# Liturgical prayer app

With this app you can have liturgical prayers.
It uses a google spreadsheet as its database source.
The app does not have a backend for user data this is stored locally instead.

The main architecture is LighterHTML and Redux. All other things are custom code.
There is a router that is also stored in Redux so time traveling for debugging is possible.

## Install

- npm install

## Google sheet

The data is gathered from the google sheet. The sheet contains all the static data:

- Moments
- Prayer categories
- Free prayer category suggestions
- Prayers for each category
- Backgrounds

The google sheet has a custom script: GoogleSheetsUniqueId.gs. This script makes sure every row has an unique ID.

If you want to create your own app you can download the file from /template from this repo. Create a google sheet from it and link it in Preload.js.