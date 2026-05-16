'use client';

import { useMemo, useRef, useState } from 'react';
import { toBlob, toPng } from 'html-to-image';
import type { PersonalityAnalysis, PersonalityResult } from '@/types/personality';
import type { SpotifyArtist } from '@/types/spotify';
import { formatGenre } from '@/lib/utils';
import { getArchetypeThemeClass } from '@/lib/themingUtils';
import { MoodSpectrum } from './MoodSpectrum';
import { ShareCard } from './ShareCard';

type PersonaCardProps = {
  analysis: PersonalityAnalysis;
};

// Known genres for artists that Spotify might not have categorized
const knownGenres: Record<string, string> = {
  'sai abhyankkar': 'Kollywood',
  ghibran: 'Film Composer',
  'bombay jayashri': 'Carnatic',
  shubh: 'Punjabi Hip-Hop',
  neffex: 'Electronic Rock',
  'anirudh ravichander': 'Kollywood',
  'yuvan shankar raja': 'Kollywood',
  'harris jayaraj': 'Film Score',
  'ar rahman': 'World Music',
  'leon james': 'Tamil Pop'
};

function ArtistSubtitle({ artist }: { artist: Pick<SpotifyArtist, 'name' | 'popularity'> & { genres?: string[] } }) {
  // Try real genre first
  if (artist.genres && artist.genres.length > 0) {
    return (
      <span style={{ fontSize: '11px', color: '#8b5cf6', textTransform: 'capitalize' }}>
        {artist.genres[0]}
      </span>
    );
  }

  // Smart detection based on name for known Indian artists
  const artistLower = artist.name.toLowerCase();
  const knownGenre = Object.entries(knownGenres).find(([key]) => artistLower.includes(key))?.[1];

  if (knownGenre) {
    return (
      <span style={{ fontSize: '11px', color: '#8b5cf6' }}>
        {knownGenre}
      </span>
    );
  }

  // Final fallback: popularity score
  if (typeof artist.popularity === 'number' && artist.popularity > 0) {
    return (
      <span style={{ fontSize: '11px', color: '#8b8a9a' }}>
        {artist.popularity}% popular
      </span>
    );
  }

  return null; // Don't show "—"
}

export function PersonaCard({ analysis }: PersonaCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const genrePillClasses = [
    'bg-fuchsia-500/15 border-fuchsia-500/35 text-fuchsia-300',
    'bg-pink-500/15 border-pink-500/35 text-pink-300',
    'bg-orange-500/15 border-orange-500/35 text-orange-300',
    'bg-emerald-500/15 border-emerald-500/35 text-emerald-300',
    'bg-cyan-500/15 border-cyan-500/35 text-cyan-300'
  ];
  const topArtistStrip = useMemo(() => analysis.topArtists.slice(0, 5), [analysis.topArtists]);
  const moodLabel = useMemo(() => {
    const { valence, energy } = analysis.mood;
    if (energy >= 0.65 && valence >= 0.55) return 'Uplifting';
    if (energy >= 0.65 && valence < 0.55) return 'Intense';
    if (energy < 0.65 && valence >= 0.55) return 'Chill';
    return 'Reflective';
  }, [analysis.mood]);
  const obscurityScore = useMemo(() => (Number.isFinite(analysis.popularity) ? analysis.popularity : 50), [analysis.popularity]);
  const shareCardResult: PersonalityResult = useMemo(
    () => ({
      archetype: analysis.archetype,
      alterEgo: analysis.alterEgo,
      summary: analysis.summary,
      moodSpectrum: {
        happiness: analysis.mood.valence,
        energy: analysis.mood.energy,
        acoustic: 1 - analysis.mood.acousticness
      },
      genreDNA: analysis.topGenres,
      user: {
        username: analysis.username
      }
    }),
    [analysis]
  );

  const downloadCard = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      // Wait for fonts to be ready if available
      if (typeof document !== 'undefined' && (document as any).fonts && (document as any).fonts.ready) {
        try {
          await (document as any).fonts.ready;
        } catch {
          // ignore font load errors and continue
        }
      }

      // First call forces font loading
      await toPng(cardRef.current, { pixelRatio: 1 });

      // Second call renders cleanly with fonts loaded
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        includeQueryParams: true
      });

      const link = document.createElement('a');
      link.download = `music-persona-${analysis.username}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Card export failed:', error);
      alert('Export failed — try right-clicking the card and saving as image');
    } finally {
      setIsExporting(false);
    }
  };

  const shareCard = async () => {
    if (!cardRef.current || !navigator.share) {
      await downloadCard();
      return;
    }

    setIsExporting(true);
    try {
      // Wait for fonts to be ready if available
      if (typeof document !== 'undefined' && (document as any).fonts && (document as any).fonts.ready) {
        try {
          await (document as any).fonts.ready;
        } catch {
          // ignore font load errors and continue
        }
      }

      // First call forces font loading
      await toPng(cardRef.current, { pixelRatio: 1 });

      // Second call renders cleanly with fonts loaded
      const blob = await toBlob(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        includeQueryParams: true
      });
      if (!blob) throw new Error('Unable to generate share image.');
      const file = new File([blob], `music-persona-${analysis.username}.png`, { type: 'image/png' });

      await navigator.share({
        title: 'Music Persona',
        text: `My Spotify persona is ${analysis.archetype.name}.`,
        files: [file]
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Share failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 animate-fadeUp">
      <div className={`relative mb-5 overflow-hidden rounded-[20px] p-7 ${getArchetypeThemeClass(analysis.archetype.id)}`}>
        <div style={{
          position: 'absolute',
          right: '-10px',
          top: '-15px',
          fontSize: '130px',
          opacity: 0.15,
          lineHeight: 1,
          userSelect: 'none',
          pointerEvents: 'none',
          filter: 'blur(1px)',
          zIndex: 0,
        }}>
          {analysis.archetype.emoji}
        </div>

        <div className="relative z-[1]">
          <div className="mb-2 text-[11px] tracking-[0.15em] text-white/80">LISTENING ARCHETYPE</div>
          <div className="mb-2 text-[32px] font-extrabold text-white">
            {analysis.archetype.emoji} {analysis.archetype.name}
          </div>
          <div className="text-[15px] text-white/85">{analysis.archetype.summary}</div>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: 'TOP GENRE', value: analysis.topGenres[0]?.genre ? formatGenre(analysis.topGenres[0].genre) : '—' },
          { label: 'MOOD', value: moodLabel },
          { label: 'OBSCURITY', value: isNaN(obscurityScore) ? '—' : `${obscurityScore}/100` }
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-white/10 bg-[#1c1c27] p-4">
            <div className="mb-1.5 text-[10px] tracking-[0.12em] text-[#8b8a9a]">{label}</div>
            <div className="text-base font-bold leading-tight text-[#f1f0f5]">{value}</div>
          </div>
        ))}
      </div>

      <hr style={{
        border: 'none',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        margin: '0',
      }} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass rounded-3xl p-5 sm:p-6">
          <h3 className="mb-3 text-[11px] tracking-[0.12em] text-[#8b8a9a]">GENRE DNA</h3>
          <div className="flex flex-wrap gap-2">
            {analysis.topGenres.length > 0 ? (
              analysis.topGenres.map((genre, index) => {
                const colors = ['#8b5cf6','#ec4899','#06b6d4','#f59e0b','#84cc16','#f97316']
                const color = colors[index % colors.length]
                return (
                  <span
                    key={genre.genre}
                    style={{
                      background: color + '22',
                      border: `1px solid ${color}55`,
                      borderRadius: '999px',
                      padding: '5px 14px',
                      fontSize: '12px',
                      color: color,
                      fontWeight: 500,
                      textTransform: 'capitalize',
                    }}
                  >
                    {formatGenre(genre.genre)} · {genre.percentage}%
                  </span>
                )
              })
            ) : (
              <span className="text-sm text-white/65">Listening more will unlock your genre profile</span>
            )}
          </div>
        </div>
        <MoodSpectrum valence={analysis.mood.valence} energy={analysis.mood.energy} acousticness={analysis.mood.acousticness} />
      </div>

      <hr style={{
        border: 'none',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        margin: '0',
        marginBottom: '32px',
      }} />

      <div className="glass rounded-3xl p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Music Alter Ego</h3>
            <p className="text-sm text-white/55">A playful name generated from your taste profile.</p>
          </div>
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-orange-400 text-2xl shadow-glow">
            ✨
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-white/45">Alter ego</p>
          <p className="mt-2 text-2xl font-semibold text-white">{analysis.alterEgo}</p>
        </div>
      </div>

      <div className="glass rounded-3xl p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Top Artists</h3>
            <p className="text-sm text-white/55">Your most influential repeat listens.</p>
          </div>
          <span className="text-xs uppercase tracking-[0.24em] text-white/45">Top 5</span>
        </div>
        <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
          {topArtistStrip.map((artist, index) => (
            <div key={artist.id} className="min-w-[132px] rounded-3xl border border-white/10 bg-black/20 p-3">
              <div className="aspect-square overflow-hidden rounded-2xl bg-white/5 relative">
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                  fontFamily: 'JetBrains Mono, monospace',
                }}>
                  {index + 1}
                </div>
                {artist.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={artist.image} alt={artist.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-3xl text-white/30">♪</div>
                )}
              </div>
              <p className="mt-3 truncate text-sm font-medium">{artist.name}</p>
              <p className="mt-1">
                <ArtistSubtitle artist={artist} />
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={downloadCard}
          disabled={isExporting}
          className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-orange-400 px-6 py-3 font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isExporting ? 'Preparing...' : 'Download Card'}
        </button>
        <button
          type="button"
          onClick={shareCard}
          disabled={isExporting}
          className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Share
        </button>
      </div>

      <div className="pointer-events-none fixed left-[-10000px] top-0">
        <ShareCard ref={cardRef} result={shareCardResult} />
      </div>
    </div>
  );
}
