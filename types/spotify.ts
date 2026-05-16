export type SpotifyImage = {
  url: string;
  width: number | null;
  height: number | null;
};

export type SpotifyArtist = {
  id: string;
  name: string;
  popularity: number;
  genres: string[];
  images: SpotifyImage[];
};

export type SpotifyTrack = {
  id: string;
  name: string;
  popularity: number;
  artists: SpotifyArtist[];
  album: {
    images: SpotifyImage[];
    name: string;
  };
};

export type AudioFeatures = {
  danceability: number;
  energy: number;
  key: number;
  loudness: number;
  mode: number;
  speechiness: number;
  acousticness: number;
  instrumentalness: number;
  liveness: number;
  valence: number;
  tempo: number;
  duration_ms: number;
  time_signature: number;
  _isFallback?: boolean;
};

export type TimeRange = 'short_term' | 'medium_term' | 'long_term';

export type GenreCount = {
  genre: string;
  count: number;
  percentage: number;
};

export type SpotifyTopTracksResponse = {
  items: SpotifyTrack[];
};

export type SpotifyTopArtistsResponse = {
  items: SpotifyArtist[];
};

export type SpotifyAudioFeaturesResponse = AudioFeatures[];
