// chipMap.js

// Legacy DB-backed keys (preserved for future database restore)
/*
const legacyChipMap = {
  "Hip Hop": "rap_music",
  "Pop": "pop_music",
  "K-Pop": "k_pop_music",
  "Rock": "rock_music",
  "Classical": "classical_music",
  "Country": "native_music",
  "Blues": "blues_music",
  "Happy": "happy_music",
  "Sad": "sad_music",
  "Jazz": "jazz_music",
  "R & B": "rnb_music",
  "Electronic": "electronic_music",
  "Romantic": "romantic_music",
  "Melancholy": "melancholy_music",
  "Focus": "focus_music",
  "Workout": "workout_music",
  "Motivational": "motivational_music",
  "Instrumental": "instrumental_music",
  "Trending": "trending_music",
  "New Releases": "latest_music",
  "Top 10": "top_music",
  "Hidden Gems": "hidden_gems_music",
  "Developer's Choice": "developers_choice_music",
};
*/

// Mapped directly to valid Spotify Seed Genres for instant load times
const chipMap = {
  "Hip Hop": "hip-hop",
  "Pop": "pop",
  "K-Pop": "k-pop",
  "Rock": "rock",
  "Classical": "classical",
  "Country": "country",
  "Blues": "blues",
  "Happy": "happy",
  "Sad": "sad",
  "Jazz": "jazz",
  "R & B": "r-n-b",
  "Electronic": "electronic",
  "Romantic": "romance",
  "Melancholy": "sad",
  "Focus": "study",
  "Workout": "work-out",
  "Motivational": "work-out",
  "Instrumental": "piano",
  "Trending": "pop",
  "New Releases": "new-release",
  "Top 10": "pop",
  "Hidden Gems": "indie",
  "Developer's Choice": "alt-rock",
};

export default chipMap;
