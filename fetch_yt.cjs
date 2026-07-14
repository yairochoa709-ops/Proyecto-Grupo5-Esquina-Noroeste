const { YoutubeTranscript } = require('youtube-transcript');
const url = process.argv[2];
YoutubeTranscript.fetchTranscript(url)
  .then(t => console.log(t.map(x => x.text).join(' ')))
  .catch(console.error);
