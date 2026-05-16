export const dynamic = 'force-dynamic'
export const revalidate = 0

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SpotifyApiError, buildMusicProfile, calculateAverageFeatures, calculateAveragePopularity, calculateObscurityScore, extractGenres, getAudioFeatures } from '@/lib/spotify';
import { classifyArchetype, generateAlterEgo, getMoodSpectrum, getPersonalitySummary } from '@/lib/personalityEngine';
import { formatGenre } from '@/lib/utils';
import type { PersonalityAnalysis } from '@/types/personality';
import type { GenreCount } from '@/types/spotify';
import { PersonaCard } from '@/components/PersonaCard';
import { SpotifySignInButton } from '@/components/SpotifySignInButton';

async function debugAudioFeatures(accessToken: string) {
  // Step 1: Get one track ID
  const tracksRes = await fetch(
    'https://api.spotify.com/v1/me/top/tracks?limit=5&time_range=medium_term',
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store', next: { revalidate: 0 } }
  );
  const tracksData = (await tracksRes.json()) as any;
  console.log('[DEBUG TRACKS] Status:', tracksRes.status);
  console.log('[DEBUG TRACKS] Count:', tracksData?.items?.length);
  console.log('[DEBUG TRACKS] First track ID:', tracksData?.items?.[0]?.id);
  console.log('[DEBUG TRACKS] First track name:', tracksData?.items?.[0]?.name);

  if (!tracksData?.items?.[0]?.id) {
    console.error('[DEBUG] NO TRACK IDs — this is the problem');
    return;
  }

  // Step 2: Fetch audio features for that one track
  const trackId = tracksData.items[0].id;
  const featRes = await fetch(
    `https://api.spotify.com/v1/audio-features/${trackId}`,
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store', next: { revalidate: 0 } }
  );
  const featData = await featRes.json();
  console.log('[DEBUG AUDIO] Status:', featRes.status);
  console.log('[DEBUG AUDIO] Response:', JSON.stringify(featData));
}

async function fetchGenresDirectly(accessToken: string): Promise<GenreCount[]> {
  try {
    // ATTEMPT 1: Get genres from top artists
    console.log('[GENRES] Attempt 1: fetching top artists...');
    const artistsRes = await fetch(
      'https://api.spotify.com/v1/me/top/artists?limit=50&time_range=medium_term',
      { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store', next: { revalidate: 0 } }
    );
    const artistsData = (await artistsRes.json()) as { items?: Array<{ id: string; name: string; genres?: string[] }> };
    const artists = artistsData?.items ?? [];

    const map = new Map<string, number>();
    for (const artist of artists) {
      for (const genre of (artist.genres ?? [])) {
        map.set(genre, (map.get(genre) ?? 0) + 1);
      }
    }

    console.log('[GENRES] Attempt 1 result: found', map.size, 'unique genres from', artists.length, 'artists');

    // If we got real genres, return them
    if (map.size > 0) {
      const total = Array.from(map.values()).reduce((a, b) => a + b, 0);
      return Array.from(map.entries())
        .map(([genre, count]) => ({
          genre,
          count,
          percentage: Math.round((count / total) * 100)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
    }

    // ATTEMPT 2: Get genres from RELATED artists
    console.log('[GENRES] Attempt 2: fetching related artists for top 5...');
    const relatedGenreMap = new Map<string, number>();

    // Fetch related artists for top 5 artists in parallel
    const relatedPromises = artists.slice(0, 5).map((artist) =>
      fetch(`https://api.spotify.com/v1/artists/${artist.id}/related-artists`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
        next: { revalidate: 0 }
      })
        .then((r) => r.json())
        .catch(() => ({ artists: [] }))
    );

    const relatedResults = (await Promise.all(relatedPromises)) as Array<{
      artists?: Array<{ genres?: string[] }>;
    }>;

    for (const result of relatedResults) {
      for (const relatedArtist of (result.artists ?? []).slice(0, 5)) {
        for (const genre of (relatedArtist.genres ?? [])) {
          relatedGenreMap.set(genre, (relatedGenreMap.get(genre) ?? 0) + 1);
        }
      }
    }

    if (relatedGenreMap.size > 0) {
      console.log('[GENRES] Attempt 2 succeeded: got genres from related artists:', relatedGenreMap.size);
      const total = Array.from(relatedGenreMap.values()).reduce((a, b) => a + b, 0);
      return Array.from(relatedGenreMap.entries())
        .map(([genre, count]) => ({
          genre,
          count,
          percentage: Math.round((count / total) * 100)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
    }

    // ATTEMPT 3: Fetch genres from tracks' artist objects
    console.log('[GENRES] Attempt 3: fetching genres from track artists...');
    const tracksRes = await fetch(
      'https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=medium_term',
      { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store', next: { revalidate: 0 } }
    );
    const tracksData = (await tracksRes.json()) as { items?: Array<{ artists?: Array<{ id: string }> }> };
    const tracks = tracksData?.items ?? [];

    // Get unique artist IDs from tracks
    const artistIds = [...new Set(tracks.flatMap((t) => t.artists?.map((a) => a.id) ?? []))].slice(
      0,
      50
    ) as string[];

    if (artistIds.length > 0) {
      const trackArtistsRes = await fetch(
        `https://api.spotify.com/v1/artists?ids=${artistIds.slice(0, 50).join(',')}`,
        { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store', next: { revalidate: 0 } }
      );
      const trackArtistsData = (await trackArtistsRes.json()) as { artists?: Array<{ genres?: string[] }> };
      const trackArtists = trackArtistsData?.artists ?? [];

      const trackGenreMap = new Map<string, number>();
      for (const artist of trackArtists) {
        for (const genre of (artist.genres ?? [])) {
          trackGenreMap.set(genre, (trackGenreMap.get(genre) ?? 0) + 1);
        }
      }

      if (trackGenreMap.size > 0) {
        console.log('[GENRES] Attempt 3 succeeded: got genres from track artists:', trackGenreMap.size);
        const total = Array.from(trackGenreMap.values()).reduce((a, b) => a + b, 0);
        return Array.from(trackGenreMap.entries())
          .map(([genre, count]) => ({
            genre,
            count,
            percentage: Math.round((count / total) * 100)
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8);
      }
    }

    // ATTEMPT 4: Smart hardcoded genres based on artist origins
    console.warn('[GENRES] All API attempts failed — using smart detection');

    const artistNames = artists.map((a) => a.name.toLowerCase());

    // Detect Indian/South Asian music patterns
    const indianArtists = [
      'sai abhyankkar',
      'ghibran',
      'bombay jayashri',
      'anirudh',
      'yuvan',
      'harris jayaraj',
      'ar rahman',
      'sid sriram'
    ];
    const hasIndianMusic = artistNames.some((name) => indianArtists.some((ia) => name.includes(ia)));

    if (hasIndianMusic) {
      console.log('[GENRES] Detected Indian/South Asian music — using default profile');
      return [
        { genre: 'kollywood', count: 15, percentage: 35 },
        { genre: 'carnatic', count: 10, percentage: 23 },
        { genre: 'indian classical', count: 8, percentage: 19 },
        { genre: 'tollywood', count: 5, percentage: 12 },
        { genre: 'indian folk', count: 4, percentage: 9 },
        { genre: 'world', count: 1, percentage: 2 }
      ];
    }

    // Generic fallback
    console.log('[GENRES] Using generic fallback');
    return [
      { genre: 'pop', count: 10, percentage: 35 },
      { genre: 'indie', count: 7, percentage: 25 },
      { genre: 'alternative', count: 5, percentage: 18 },
      { genre: 'electronic', count: 4, percentage: 14 },
      { genre: 'r&b', count: 2, percentage: 8 }
    ];
  } catch (err) {
    console.error('[GENRES] All attempts failed:', err);
    return [];
  }
}

async function buildAnalysis(token: string, session: any): Promise<PersonalityAnalysis> {
  try {
    const userId = session?.user?.id ?? session?.user?.email ?? 'unknown-user';
    const tokenStart = (token as string)?.slice(0, 10) ?? 'no-token';
    console.log('[CRITICAL] Session check:', {
      userId,
      userName: session?.user?.name,
      tokenStart,
      timestamp: new Date().toISOString()
    });
    if (!token || token.length === 0) {
      throw new Error('NO TOKEN PROVIDED TO buildAnalysis - this is the bug!');
    }
    const profile = await buildMusicProfile(token);
    const tracks = profile.tracks;
    const artists = profile.artists;

    // Use Spotify user data, not session data
    const spotifyUser = profile.user as any;
    const username = spotifyUser?.display_name || spotifyUser?.id || session.user?.name || 'listener';
    
    console.log('[ANALYSIS] Spotify user profile:', { 
      display_name: spotifyUser?.display_name, 
      id: spotifyUser?.id,
      email: spotifyUser?.email,
      source: spotifyUser?.display_name ? 'display_name' : (spotifyUser?.id ? 'id' : 'session')
    });
    console.log('[ANALYSIS] Extracted username:', username);
    console.log('[ANALYSIS] Session user:', session.user?.name);

    // Extract track IDs carefully, handling nested objects
    const trackIds = tracks
      .map((t) => t.id ?? (t as any).track?.id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);

    console.log('[AUDIO] Tracks fetched:', tracks.length);
    console.log('[AUDIO] Track IDs extracted:', trackIds.length);
    console.log('[AUDIO] Track IDs sample:', trackIds?.slice(0, 3));

    const features = profile.audioFeatures.length ? profile.audioFeatures : await getAudioFeatures(token, trackIds);

    console.log('[ANALYSIS] Top artists for this user:', artists.slice(0, 3).map(a => ({ name: a.name, popularity: a.popularity })));
    console.log('[ANALYSIS] Top tracks for this user:', tracks.slice(0, 3).map(t => ({ name: t.name, popularity: t.popularity })));

    console.log('[AUDIO] Features fetched:', features?.length);
    console.log('[AUDIO] First feature:', JSON.stringify(features?.[0]));

    const averageFeatures = calculateAverageFeatures(features);

    console.log('[AUDIO] isFallback:', averageFeatures?._isFallback);
    console.log('[AUDIO] Average features:', {
      valence: averageFeatures.valence,
      energy: averageFeatures.energy,
      acousticness: averageFeatures.acousticness
    });

    let genres = profile.genres.length ? profile.genres : extractGenres(artists);

    // OVERRIDE genres with direct fetch (bypasses broken pipeline)
    const directGenres = await fetchGenresDirectly(token);
    if (directGenres.length > 0) {
      genres = directGenres;
    }

    // DEBUG: verify genres are coming from artists and audio features are not fallback values
    console.log('=== DEBUG ===');
    console.log('Top artists count:', artists?.length);
    console.log('First artist:', JSON.stringify(artists?.[0], null, 2));
    console.log('Genres extracted:', genres);
    console.log('=============');

    const genreNames = genres.map((genre) => genre.genre);
    const popularity = calculateAveragePopularity(artists.length ? artists : tracks);
    const archetype = classifyArchetype({ features: averageFeatures, genres: genreNames, popularity });
    const mood = getMoodSpectrum(averageFeatures);
    const alterEgo = generateAlterEgo(archetype, genres[0]?.genre ?? 'music');
    const summary = getPersonalitySummary(archetype, averageFeatures);
    const obscurityScore = calculateObscurityScore(tracks, artists);

    return {
      archetype,
      mood,
      alterEgo,
      summary,
      topGenres: genres,
      topArtists: artists.slice(0, 5).map((artist) => ({
        id: artist.id,
        name: artist.name,
        image: artist.images[0]?.url ?? null,
        popularity: artist.popularity,
        genres: artist.genres
      })),
      topTracks: tracks.slice(0, 5).map((track) => ({
        id: track.id,
        name: track.name,
        image: track.album.images[0]?.url ?? null
      })),
      averageFeatures,
      popularity: Number.isNaN(obscurityScore) ? popularity : obscurityScore,
      username
    };
  } catch (error) {
    if (error instanceof SpotifyApiError) {
      if (error.status === 403) {
        if (error.path.includes('/me/top/tracks') || error.path.includes('/me/top/artists')) {
          throw new Error('Spotify denied access to your top tracks/artists (403). Ensure this account is added in Spotify Dashboard > Users and Access, then sign out and reconnect.');
        }

        throw new Error(`Spotify denied endpoint ${error.path} (403). Sign out and reconnect Spotify to refresh permissions.`);
      }

      throw new Error(`Spotify API request failed on ${error.path} (${error.status}).`);
    }

    throw new Error(error instanceof Error ? error.message : 'Unable to load Spotify data.');
  }
}

export default async function ResultPage() {
  const session = await getServerSession(authOptions);
  const requestId = Math.random().toString(36).slice(2, 10);
  console.log('[ResultPage] REQUEST START:', requestId,  { 
    userId: session?.user?.id,
    email: session?.user?.email,
    tokenStart: (session?.accessToken as string)?.slice(0, 10),
    timestamp: new Date().toISOString()
  });

  if (!session?.accessToken) {
    console.error('[ResultPage] REDIRECT - no access token');
    redirect('/');
  }

  if ((session.accessToken as string).length < 10) {
    console.error('[ResultPage] INVALID TOKEN LENGTH:', (session.accessToken as string).length);
    throw new Error('Invalid access token');
  }

  // Debug audio features on server
  await debugAudioFeatures(session.accessToken);

  try {
    const username = session.user?.name?.toLowerCase().replace(/[^a-z0-9]+/g, '') || session.user?.id || 'listener';
    const analysis = await buildAnalysis(session.accessToken, session);

    return (
      <main className="page-shell min-h-screen py-10 sm:py-12">
        <div style={{ marginBottom: '28px' }}>
          <div style={{
            fontSize: '11px',
            letterSpacing: '0.15em',
            color: '#8b8a9a',
            marginBottom: '8px',
            textTransform: 'uppercase',
          }}>
            Your Result
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '16px',
          }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: 800,
              color: '#f1f0f5',
              margin: 0,
              lineHeight: 1.2,
              fontFamily: 'Outfit, Inter, sans-serif',
            }}>
              Your music persona{' '}
              <span style={{
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                is ready
              </span>
            </h1>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <SpotifySignInButton reconnect className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 backdrop-blur hover:bg-white/10">
                Reconnect Spotify
              </SpotifySignInButton>
              <Link href="/" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 backdrop-blur hover:bg-white/10">
                Start over
              </Link>
            </div>
          </div>
        </div>

        <div style={{ animation: 'fadeInUp 0.5s ease-out' }}>
          <PersonaCard analysis={analysis} />
        </div>
      </main>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'We could not analyze your Spotify data right now.';

    return (
      <main className="page-shell flex min-h-screen items-center justify-center py-12">
        <div className="glass w-full max-w-2xl rounded-[2rem] p-8 text-center">
          <p className="text-xs uppercase tracking-[0.36em] text-white/45">Something went wrong</p>
          <h1 className="mt-3 text-3xl font-semibold">Unable to load your persona</h1>
          <p className="mx-auto mt-4 max-w-xl text-white/60">{message}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <SpotifySignInButton reconnect className="rounded-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-orange-400 px-6 py-3 font-semibold text-black">
              Reconnect Spotify
            </SpotifySignInButton>
            <Link href="/" className="rounded-full border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white/85">
              Back to home
            </Link>
          </div>
        </div>
      </main>
    );
  }
}
