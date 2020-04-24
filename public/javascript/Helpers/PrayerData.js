const url = 'https://spreadsheets.google.com/feeds/cells/18qkOV9qO0B5WyKn99L2S2Aa8O6DMy839ABvpWnrGl6o/1/public/values?alt=json';

export class PrayerData {

  async suggestions () {
    return [
      { name: 'Friends' },
      { name: 'My church' },
      { name: 'The city' },
      { name: 'Family' },
    ];
  }

  async categories () {
    return [
      { name: 'The psalms and Hymns' },
      { name: 'The early church fathers' },
      { name: 'the Lord\'s Prayer' },
    ];
  }

}