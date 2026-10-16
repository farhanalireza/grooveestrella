// src/lib/nameGenerator.js

// ==========================================
// Adjective + Noun Generator
// ==========================================
export const ADJECTIVES = [
  // Music people
  'Vinyl', 'Fuzzy', 'Funky', 'Dusty', 'Lo-Fi', 'Indie', 'Jazzy',
  'Tipsy', 'Groovy', 'Wonky', 'Feral', 'Sleepy', 'Moody', 'Cheeky',
  'Salty', 'Rusty', 'Freaky', 'Wonky', 'Shaggy', 'Scruffy',

  // Cool & characterful
  'Velvet', 'Lucky', 'Shady', 'Sneaky', 'Lazy', 'Wild', 'Local',
  'Weird', 'Happy', 'Grumpy', 'Lonely', 'Messy', 'Cosmic', 'Faded',
  'Golden', 'Electric', 'Plastic', 'Analog', 'Retro', 'Rogue',

  // Late-night music energy
  'Midnight', 'Sleepy', 'Tipsy', 'Drowsy', 'Hazy', 'Dreamy', 'Dusky',
  'Moonlit', 'Sunburnt', 'Restless', 'Wasted', 'Mellow', 'Bleary',
  'Afterhours', 'Sunday', 'Heartbreak', 'Blue', 'Smoky', 'Lovesick',

  // Music culture
  'Basement', 'Garage', 'Bedroom', 'Backstage', 'Underground', 'Forgotten',
  'Cult', 'Obscure', 'B-Side', 'Deepcut', 'Rare', 'Bootleg', 'Unplugged',
  'Overplayed', 'Underrated', 'Unreleased', 'Offbeat', 'OuttaTune',

  // Slightly ridiculous (in a good way)
  'Greasy', 'Goofy', 'Dizzy', 'Chunky', 'Spicy', 'Wobbly', 'Nerdy',
  'Dramatic', 'Chaotic', 'Unhinged', 'Grimy', 'Bizarre', 'Soggy',
  'Caffeinated', 'Broke', 'Restless', 'Delulu', 'Certified', 'Suspicious'
];

export const NOUNS = [
  // Music lovers
  'Groover', 'Headbanger', 'RecordNerd', 'VinylGoblin', 'MusicRat',
  'AlbumJunkie', 'TuneFiend', 'TrackHoarder', 'MusicGeek', 'Songbird',
  'BeatFreak', 'CrateDigger', 'DiscJockey', 'Melomaniac', 'Audiophile',
  'NoiseMaker', 'GigRat', 'JamBuddy', 'SoundAddict', 'TuneBandit',

  // Actual music things
  'B-Side', 'DeepCut', 'Mixtape', 'Cassette', 'Turntable', 'NeedleDrop',
  'Sleeve', 'Record', 'Groovebox', 'DrumKit', 'Riff', 'Bassline',
  'Feedback', 'Fuzzbox', 'Distortion', 'Backbeat', 'Soundcheck', 'Encore',
  'Setlist', 'DemoTape', 'Bootleg', 'Reverb', 'AmpStack', 'WahWah',

  // Characters
  'Gremlin', 'Goblin', 'Menace', 'Bandit', 'Outlaw', 'Rascal', 'Creature',
  'Bandito', 'Daydreamer', 'NightOwl', 'Wanderer', 'Drifter', 'Loner',
  'Troublemaker', 'Hooligan', 'Oddball', 'Misfit', 'Maniac', 'Muppet',
  'Nuisance', 'Legend', 'Dinosaur', 'Cryptid', 'Maverick', 'Rebel',

  // Album-listening culture
  'AlbumGoblin', 'SkipButton', 'TrackZero', 'HiddenTrack', 'BonusTrack',
  'VinylDealer', 'SleeveCollector', 'PlaylistGremlin', 'AlbumSnob',
  'TrackOne', 'LastTrack', 'SideA', 'SideB', 'RepeatButton',
  'Gatekeeper', 'ChartHater', 'TasteMaker', 'HotTake', 'CultClassic',

  // Atmospheric & aesthetic
  'Moonchild', 'Daytripper', 'Stargazer', 'Dreamboat', 'Heartbreaker',
  'Nightcrawler', 'Moonwalker', 'SpaceCadet', 'Sunflower', 'BlueNote',
  'GhostNote', 'Firestarter', 'SlowDancer', 'Roadie', 'Showstopper'
];

export function generateRandomName() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj} ${noun}`;
}

/**
 * Ensures user has an aesthetic name in localStorage; if missing or default, generates one.
 */
export function getOrSetUserName() {
  if (typeof window === "undefined") return "CosmicGroover";
  try {
    const existing = localStorage.getItem("userName");
    if (existing && existing !== "User" && existing !== "Music Explorer" && existing.trim() !== "") {
      return existing;
    }
    const fresh = generateRandomName();
    localStorage.setItem("userName", fresh);
    return fresh;
  } catch (_) {
    return "CosmicGroover";
  }
}
