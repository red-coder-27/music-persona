import type { AudioFeatures } from './spotify';
import type { GenreCount } from './spotify';

export type ArchetypeId =
  | 'nocturnal-dreamer'
  | 'hype-machine'
  | 'emotional-architect'
  | 'indie-wanderer'
  | 'bass-addict'
  | 'genre-scientist'
  | 'heartbreak-connoisseur'
  | 'mainstream-maven';

export type Archetype = {
  id: ArchetypeId;
  emoji: string;
  name: string;
  summary: string;
  gradient: [string, string, string];
};

export type MoodSpectrum = {
  valence: number;
  energy: number;
  acousticness: number;
};

export type PersonalityAnalysis = {
  archetype: Archetype;
  mood: MoodSpectrum;
  alterEgo: string;
  summary: string;
  topGenres: GenreCount[];
  topArtists: Array<{ id: string; name: string; image: string | null; popularity: number; genres?: string[] }>;
  topTracks: Array<{ id: string; name: string; image: string | null }>;
  averageFeatures: AudioFeatures;
  popularity: number;
  username: string;
};

export type PersonalityResult = {
  archetype: Archetype;
  alterEgo: string;
  summary: string;
  moodSpectrum: {
    happiness: number;
    energy: number;
    acoustic: number;
  };
  genreDNA: GenreCount[];
  user: {
    username: string;
  };
};
