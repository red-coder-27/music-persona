import type { AudioFeatures, GenreCount, SpotifyArtist, SpotifyTrack, TimeRange } from '@/types/spotify';

export type MusicProfile = {
  tracks: SpotifyTrack[];
  artists: SpotifyArtist[];
  genres: GenreCount[];
  audioFeatures: AudioFeatures[];
  recentlyPlayed: Array<Record<string, unknown>>;
  user: Record<string, unknown>;
};

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

export class SpotifyApiError extends Error {
  status: number;
  path: string;
  payload: string;

  constructor(status: number, path: string, payload: string) {
    super(`Spotify API error ${status} on ${path}: ${payload}`);
    this.name = 'SpotifyApiError';
    this.status = status;
    this.path = path;
    this.payload = payload;
  }
}

async function spotifyFetch<T>(token: string, path: string): Promise<T> {
  const response = await fetch(`${SPOTIFY_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    cache: 'no-store',
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new SpotifyApiError(response.status, path, payload);
  }

  return response.json() as Promise<T>;
}

export async function getTopTracks(token: string, timeRange: TimeRange = 'medium_term', limit = 50) {
  const result = await spotifyFetch<{ items: SpotifyTrack[] }>(token, `/me/top/tracks?limit=${limit}&time_range=${timeRange}`);
  if (!result.items || !result.items.length) {
    // telemetry: no top tracks returned for this token/session
    // keep message concise to avoid leaking sensitive info
    // developers can inspect server logs for further investigation
    // eslint-disable-next-line no-console
    console.warn('Spotify: no top tracks returned');
  }
  return result.items;
}

export async function getTopArtists(token: string, timeRange: TimeRange = 'medium_term', limit = 50): Promise<SpotifyArtist[]> {
  const result = await spotifyFetch<{ items: SpotifyArtist[] }>(token, `/me/top/artists?limit=${limit}&time_range=${timeRange}`);
  if (!result.items || !result.items.length) {
    // telemetry: no top artists returned
    // eslint-disable-next-line no-console
    console.warn('Spotify: no top artists returned');
  }
  return result.items;
}

export async function getAudioFeatures(token: string, trackIds: string[]) {
  if (!trackIds || !trackIds.length) return [] as AudioFeatures[];
  console.log('[getAudioFeatures] Token:', token?.slice(0, 10), 'trackIds:', trackIds.length);

  const chunks: string[][] = [];
  for (let i = 0; i < trackIds.length; i += 100) {
    chunks.push(trackIds.slice(i, i + 100));
  }

  const allFeatures: AudioFeatures[] = [];

  for (const chunk of chunks) {
    const res = await fetch(`${SPOTIFY_API_BASE}/audio-features?ids=${chunk.join(',')}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache'
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    });

    if (!res.ok) {
      const errorText = await res.text();
      // eslint-disable-next-line no-console
      console.error(`Audio features API failed: ${res.status}`, errorText);

      if (res.status === 403) {
        return [] as AudioFeatures[];
      }

      continue;
    }

    const data = (await res.json()) as { audio_features?: Array<AudioFeatures | null> };
    const valid = (data.audio_features ?? []).filter((feature): feature is AudioFeatures => feature !== null);
    allFeatures.push(...valid);
  }

  // eslint-disable-next-line no-console
  console.log(`Audio features: fetched ${allFeatures.length} valid out of ${trackIds.length} tracks`);
  return allFeatures;
}

export function extractGenres(artists: SpotifyArtist[]): GenreCount[] {
  if (!artists || artists.length === 0) {
    // eslint-disable-next-line no-console
    console.warn('extractGenres: no artists provided');
    return [];
  }

  const genreMap = new Map<string, number>();

  for (const artist of artists) {
    const genres = artist.genres;
    if (!Array.isArray(genres)) continue;
    for (const genre of genres) {
      genreMap.set(genre, (genreMap.get(genre) ?? 0) + 1);
    }
  }

  if (genreMap.size === 0) {
    // eslint-disable-next-line no-console
    console.warn(
      'extractGenres: artists had no genre data',
      artists.slice(0, 3).map((artist) => ({ name: artist.name, genres: artist.genres }))
    );
    return [];
  }

  const total = Array.from(genreMap.values()).reduce((sum, count) => sum + count, 0);

  return Array.from(genreMap.entries())
    .map(([genre, count]) => ({
      genre,
      count,
      percentage: Math.round((count / total) * 100)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

export function calculateAverageFeatures(audioFeatures: AudioFeatures[]) {
  const defaults: AudioFeatures = {
    danceability: 0.5,
    energy: 0.5,
    key: 0,
    loudness: 0,
    mode: 0,
    speechiness: 0.1,
    acousticness: 0.5,
    instrumentalness: 0.5,
    liveness: 0.2,
    valence: 0.5,
    tempo: 120,
    duration_ms: 0,
    time_signature: 0
  };

  const valid = (audioFeatures ?? []).filter(
    (feature): feature is AudioFeatures =>
      feature !== null &&
      feature !== undefined &&
      typeof feature.valence === 'number' &&
      typeof feature.energy === 'number'
  );

  if (!valid.length) {
    // eslint-disable-next-line no-console
    console.error('calculateAverageFeatures: NO valid features!', 'Input length was:', audioFeatures.length);
    return {
      valence: 0.42,
      energy: 0.42,
      danceability: 0.42,
      acousticness: 0.42,
      instrumentalness: 0,
      speechiness: 0,
      liveness: 0,
      tempo: 120,
      key: 0,
      loudness: 0,
      mode: 0,
      duration_ms: 0,
      time_signature: 0,
      _isFallback: true
    };
  }

  const sum = valid.reduce<AudioFeatures>((acc, feature) => {
    acc.danceability += feature.danceability ?? 0;
    acc.energy += feature.energy ?? 0;
    acc.key += feature.key ?? 0;
    acc.loudness += feature.loudness ?? 0;
    acc.mode += feature.mode ?? 0;
    acc.speechiness += feature.speechiness ?? 0;
    acc.acousticness += feature.acousticness ?? 0;
    acc.instrumentalness += feature.instrumentalness ?? 0;
    acc.liveness += feature.liveness ?? 0;
    acc.valence += feature.valence ?? 0;
    acc.tempo += feature.tempo ?? 0;
    acc.duration_ms += feature.duration_ms ?? 0;
    acc.time_signature += feature.time_signature ?? 0;
    return acc;
  }, { ...defaults });

  const count = valid.length;
  return {
    danceability: sum.danceability / count,
    energy: sum.energy / count,
    key: Math.round(sum.key / count),
    loudness: sum.loudness / count,
    mode: Math.round(sum.mode / count),
    speechiness: sum.speechiness / count,
    acousticness: sum.acousticness / count,
    instrumentalness: sum.instrumentalness / count,
    liveness: sum.liveness / count,
    valence: sum.valence / count,
    tempo: sum.tempo / count,
    duration_ms: sum.duration_ms / count,
    time_signature: Math.round(sum.time_signature / count),
    _isFallback: false
  };
}

export function calculateObscurityScore(tracks: SpotifyTrack[], artists: SpotifyArtist[]): number {
  // Try artists first (more reliable popularity data)
  const artistPops = artists
    .filter(a => typeof a.popularity === 'number' && a.popularity > 0)
    .map(a => a.popularity)

  if (artistPops.length > 0) {
    const avg = artistPops.reduce((s, p) => s + p, 0) / artistPops.length
    return Math.round(100 - avg)  // Invert: low popularity = high obscurity
  }

  // Fallback: try tracks
  const trackPops = tracks
    .filter(t => typeof t.popularity === 'number' && t.popularity > 0)
    .map(t => t.popularity)

  if (trackPops.length > 0) {
    const avg = trackPops.reduce((s, p) => s + p, 0) / trackPops.length
    return Math.round(100 - avg)
  }

  // True fallback — no data at all
  console.warn('Obscurity: no popularity data found in artists or tracks')
  return 42  // Use 42 not 50 so you can tell it's a fallback
}

export async function buildMusicProfile(token: string, timeRange: TimeRange = 'medium_term'): Promise<MusicProfile> {
  const tokenStart = token?.slice(0, 10) ?? 'no-token';
  console.log('[buildMusicProfile] Starting with token:', tokenStart, 'timeRange:', timeRange);
  const [tracksRes, artistsRes, recentRes, profileRes] = await Promise.all([
    fetch(`https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=${timeRange}`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache'
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    }),
    fetch(`https://api.spotify.com/v1/me/top/artists?limit=50&time_range=${timeRange}`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache'
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    }),
    fetch('https://api.spotify.com/v1/me/player/recently-played?limit=50', {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache'
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    }),
    fetch('https://api.spotify.com/v1/me', {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache'
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    })
  ]);  console.log('[buildMusicProfile] Responses received:', { tracks: tracksRes.status, artists: artistsRes.status, recent: recentRes.status, profile: profileRes.status });

  const [tracksData, artistsData, recentData, profileData] = await Promise.all([
    tracksRes.json(),
    artistsRes.json(),
    recentRes.json(),
    profileRes.json()
  ]);

  const tracks: SpotifyTrack[] = tracksData.items ?? [];
  const artists: SpotifyArtist[] = artistsData.items ?? [];

  const genreCounts = new Map<string, number>();
  artists.forEach((artist) => {
    (artist.genres ?? []).forEach((genre) => {
      genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
    });
  });

  const totalGenreCount = Array.from(genreCounts.values()).reduce((a, b) => a + b, 0);
  const genres = Array.from(genreCounts.entries())
    .map(([genre, count]) => ({
      genre,
      count,
      percentage: totalGenreCount > 0 ? Math.round((count / totalGenreCount) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // eslint-disable-next-line no-console
  console.log('genres found:', genres.length, genres.slice(0, 3));

  const trackIds = tracks.map((track) => track.id).filter(Boolean);
  const audioFeatures = await getAudioFeatures(token, trackIds);

  return {
    tracks,
    artists,
    genres,
    audioFeatures,
    recentlyPlayed: recentData.items ?? [],
    user: profileData
  };
}

export function calculateAveragePopularity(items: Array<{ popularity: number }>) {
  if (!items.length) return 0;
  return Math.round(items.reduce((sum, item) => sum + item.popularity, 0) / items.length);
}
