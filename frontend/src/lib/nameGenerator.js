// src/lib/nameGenerator.js

export const ADJECTIVES = [
  "Cosmic", "Funky", "Velvet", "Electric", "Harmonic", "Golden", "Sonic", 
  "Melodic", "Astral", "Dreamy", "Groovy", "Vibrant", "Mystic", "Serene", 
  "Neon", "Echoing", "Radiant", "Vintage", "Lyrical", "Breezy", "Celestial", 
  "Rhythmic", "Soulful", "Chill", "Stellar", "Amber", "Euphoric", "Infinite", 
  "Retro", "Polite", "Gentle", "Midnight", "Sunny", "Luminous", "Smooth", 
  "Subtle", "Velvety", "Silent", "Crimson", "Sapphire", "Dynamic", "Acoustic",
  "Silver", "Dusk", "Dawn", "Echo", "Prismatic", "Hyper", "Magnetic", "Solar"
];

export const NOUNS = [
  "Groover", "Vinyl", "Melody", "Echo", "Rhythm", "Starlight", "Beat", 
  "Aura", "Harmony", "Maestro", "Vibe", "Cadence", "Explorer", "Voyager", 
  "Chime", "Rhapsody", "Tempo", "Treble", "Reverb", "Serenade", "Bassline", 
  "Symphony", "Nomad", "Sonata", "Pulse", "Wanderer", "Listener", "Auditor", 
  "Frequency", "Chord", "Drifter", "Synthesizer", "Cassette", "Soundwave"
];

/**
 * Generates an aesthetic Adjective + Noun combo (e.g. "CosmicGroover", "VelvetEcho")
 */
export function generateRandomName() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj}${noun}`;
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
