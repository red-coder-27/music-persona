import type { AudioFeatures } from '@/types/spotify';
import type { Archetype, ArchetypeId, MoodSpectrum } from '@/types/personality';

type ClassifierInput = {
  features: AudioFeatures;
  genres: string[];
  popularity: number;
};

const archetypes: Record<ArchetypeId, Archetype> = {
  'nocturnal-dreamer': {
    id: 'nocturnal-dreamer',
    emoji: '🌙',
    name: 'The Nocturnal Dreamer',
    summary: 'Late-night listener with a cinematic, introspective streak.',
    gradient: ['#24104f', '#0f1a4d', '#050816']
  },
  'hype-machine': {
    id: 'hype-machine',
    emoji: '⚡',
    name: 'The Hype Machine',
    summary: 'Built for momentum, adrenaline, and instant replay energy.',
    gradient: ['#f7e70b', '#f97316', '#111111']
  },
  'emotional-architect': {
    id: 'emotional-architect',
    emoji: '🎭',
    name: 'The Emotional Architect',
    summary: 'Balances contrast beautifully, turning mood swings into art.',
    gradient: ['#fb7185', '#8b5cf6', '#140b1a']
  },
  'indie-wanderer': {
    id: 'indie-wanderer',
    emoji: '🌿',
    name: 'The Indie Wanderer',
    summary: 'Quietly adventurous, always one deep cut ahead of the crowd.',
    gradient: ['#14532d', '#8b5a2b', '#0c0a09']
  },
  'bass-addict': {
    id: 'bass-addict',
    emoji: '🔥',
    name: 'The Bass Addict',
    summary: 'Rhythm-first, chest-rattling, and impossible to ignore.',
    gradient: ['#2563eb', '#ec4899', '#09090b']
  },
  'genre-scientist': {
    id: 'genre-scientist',
    emoji: '🧠',
    name: 'The Genre Scientist',
    summary: 'Curious, analytical, and obsessed with the edges of taste.',
    gradient: ['#14b8a6', '#10b981', '#081018']
  },
  'heartbreak-connoisseur': {
    id: 'heartbreak-connoisseur',
    emoji: '💔',
    name: 'The Heartbreak Connoisseur',
    summary: 'Feels deeply, loves slowly, and finds beauty in the ache.',
    gradient: ['#7f1d1d', '#111827', '#030712']
  },
  'mainstream-maven': {
    id: 'mainstream-maven',
    emoji: '✨',
    name: 'The Mainstream Maven',
    summary: 'Taste that stays in the cultural current without losing polish.',
    gradient: ['#facc15', '#ffffff', '#111111']
  }
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const averageGenreLength = (genres: string[]) => (genres.length ? genres.join(' ').length / genres.length : 0);

export function classifyArchetype({ features, genres, popularity }: ClassifierInput): Archetype {
  const diversity = new Set(genres.map((genre) => genre.toLowerCase())).size;
  const genreSpread = diversity / Math.max(genres.length || 1, 1);
  const acoustic = features.acousticness;
  const energy = features.energy;
  const dance = features.danceability;
  const valence = features.valence;
  const tempo = features.tempo;
  const avgGenreLength = averageGenreLength(genres);

  if (popularity >= 72 && genres.some((genre) => /pop|dance|top/i.test(genre))) {
    return archetypes['mainstream-maven'];
  }

  if (dance >= 0.78 && energy >= 0.75 && acoustic <= 0.25) {
    return archetypes['bass-addict'];
  }

  if (energy >= 0.72 && dance >= 0.74 && tempo >= 122) {
    return archetypes['hype-machine'];
  }

  if (popularity <= 42 && acoustic >= 0.48) {
    return archetypes['indie-wanderer'];
  }

  if (valence <= 0.35 && tempo <= 104 && acoustic >= 0.42) {
    return archetypes['heartbreak-connoisseur'];
  }

  if (genreSpread >= 0.7 || genres.length >= 8) {
    return archetypes['genre-scientist'];
  }

  if (energy <= 0.5 && acoustic >= 0.52 && valence <= 0.45) {
    return archetypes['nocturnal-dreamer'];
  }

  if (Math.abs(valence - energy) <= 0.18 && avgGenreLength > 5.5) {
    return archetypes['emotional-architect'];
  }

  return archetypes['emotional-architect'];
}

export function getMoodSpectrum(features: AudioFeatures): MoodSpectrum {
  return {
    valence: clamp(features.valence),
    energy: clamp(features.energy),
    acousticness: clamp(features.acousticness)
  };
}

export function generateAlterEgo(archetype: Archetype, topGenre: string): string {
  // Prefix lookup per archetype — poetic words, not data values
  const prefixes: Record<string, string[]> = {
    'nocturnal-dreamer': ['Midnight', 'Shadow', 'Lunar', 'Velvet', 'Dusk'],
    'hype-machine': ['Neon', 'Electric', 'Turbo', 'Blazing', 'Hyper'],
    'emotional-architect': ['Crimson', 'Silver', 'Phantom', 'Crystal', 'Echo'],
    'indie-wanderer': ['Amber', 'Copper', 'Wandering', 'Sage', 'Muted'],
    'bass-addict': ['Thunder', 'Deep', 'Magnetic', 'Iron', 'Pulse'],
    'genre-scientist': ['Sonic', 'Prism', 'Quantum', 'Spectral', 'Cosmic'],
    'heartbreak-connoisseur': ['Hollow', 'Fading', 'Silent', 'Broken', 'Ashen'],
    'mainstream-maven': ['Golden', 'Radiant', 'Stellar', 'Bright', 'Solar']
  };

  const suffixes: Record<string, string[]> = {
    'nocturnal-dreamer': ['Ghost', 'Wanderer', 'Reverie', 'Specter', 'Dreamer'],
    'hype-machine': ['Prophet', 'Catalyst', 'Dynamo', 'Surge', 'Ignite'],
    'emotional-architect': ['Weaver', 'Architect', 'Sculptor', 'Composer', 'Sage'],
    'indie-wanderer': ['Pilgrim', 'Drifter', 'Soul', 'Nomad', 'Seeker'],
    'bass-addict': ['Titan', 'Oracle', 'Surge', 'Cyclone', 'Force'],
    'genre-scientist': ['Alchemist', 'Scholar', 'Oracle', 'Seeker', 'Sage'],
    'heartbreak-connoisseur': ['Echo', 'Relic', 'Elegy', 'Sorrow', 'Dirge'],
    'mainstream-maven': ['Icon', 'Luminary', 'Beacon', 'Star', 'Pulse']
  };

  // Map genre to a POETIC descriptor (never use raw genre/artist name)
  const genreDescriptors: Record<string, string> = {
    kollywood: 'Cinematic',
    carnatic: 'Classical',
    'indian classical': 'Ancient',
    tollywood: 'Dramatic',
    'indie pop': 'Ethereal',
    'indie rock': 'Rawbone',
    'hip hop': 'Rhythm',
    'r&b': 'Velvet',
    electronic: 'Digital',
    pop: 'Prism',
    alternative: 'Spectrum',
    folk: 'Rootborn',
    jazz: 'Midnight',
    classical: 'Timeless',
    metal: 'Ironclad',
    'lo-fi': 'Hazy',
    ambient: 'Drifting',
    world: 'Boundless',
    'indian folk': 'Ancestral'
  };

  const archetypeId = archetype.id;
  const prefixList = prefixes[archetypeId] ?? ['Sonic', 'Phantom', 'Cosmic'];
  const suffixList = suffixes[archetypeId] ?? ['Wanderer', 'Seeker', 'Soul'];

  // Get descriptor from genre — never use raw genre string
  const genreKey = topGenre.toLowerCase();
  const descriptor =
    genreDescriptors[genreKey] ??
    genreDescriptors[
      Object.keys(genreDescriptors).find((k) => genreKey.includes(k)) ?? ''
    ] ??
    'Ethereal';

  // Pick deterministically (not random — consistent per user)
  const prefixIdx = archetypeId.length % prefixList.length;
  const suffixIdx = (archetypeId.length + 1) % suffixList.length;

  return `The ${prefixList[prefixIdx]} ${descriptor} ${suffixList[suffixIdx]}`;
  // Example: "The Sonic Cinematic Alchemist"
  // Example: "The Crimson Ethereal Weaver"
  // NEVER: "Sonic Sai Abhyankkar Alchemist"
}

export function getPersonalitySummary(archetype: Archetype, features: AudioFeatures): string {
  const moodWord = features.valence > 0.62 ? 'bright' : features.valence < 0.38 ? 'wistful' : 'balanced';
  const energyWord = features.energy > 0.7 ? 'high-voltage' : features.energy < 0.45 ? 'laid-back' : 'measured';
  const tempoWord = features.tempo > 125 ? 'fast-moving' : features.tempo < 100 ? 'unhurried' : 'steady';

  return `${archetype.summary} Your listening leans ${moodWord}, ${energyWord}, and ${tempoWord}.\nYour music profile suggests you gravitate toward sounds that mirror your inner weather.`;
}

export function getArchetypeTheme(archetype: Archetype) {
  return {
    background: `linear-gradient(145deg, ${archetype.gradient[0]}, ${archetype.gradient[1]} 58%, ${archetype.gradient[2]})`
  };
}
