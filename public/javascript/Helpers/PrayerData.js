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
      { name: 'The psalms and Hymns', description: 'The Book of Psalms (/sɑːmz/ or /sɔː(l)mz/ SAW(L)MZ; Hebrew: תְּהִלִּים, Tehillim, "praises"), commonly referred to simply as Psalms, the Psalter or "the Psalms", is the first book of the Ketuvim ("Writings"), the third section of the Hebrew Bible, and thus a book of the Christian Old Testament.[1] The title is derived from the Greek translation, ψαλμοί, psalmoi, meaning "instrumental music" and, by extension, "the words accompanying the music".[2] The book is an anthology of individual psalms, with 150 in the Jewish and Western Christian tradition and more in the Eastern Christian churches.[3][4] Many are linked to the name of David, but his authorship is not accepted by modern scholars.[4]' },
      { name: 'The early church fathers', description: 'The Church Fathers, Early Church Fathers, Christian Fathers, or Fathers of the Church were ancient and influential Christian theologians and writers who established the intellectual and doctrinal foundations of Christianity. There is no definitive list.[1] The historical period during which they flourished is referred to by scholars as the Patristic Era ending approximately around AD 700 (John of Damascus died in 749 AD, Byzantine Iconoclasm began in 726 AD[2][3]).\n' +
          '\n' +
          'In the past, the Church Fathers were regarded as authoritative and more restrictive definitions were used which sought to limit the list to authors treated as such. However, the definition has widened as scholars of patristics, the study of the Church Fathers, have expanded their scope.[4] ' },
      { name: 'the Lord\'s Prayer', description: 'The Lord\'s Prayer, also called the Our Father (Latin: Pater Noster), is a central Christian prayer which, according to the New Testament, Jesus taught as the way to pray: ' },
    ];
  }

}