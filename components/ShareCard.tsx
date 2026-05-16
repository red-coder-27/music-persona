'use client'

import { forwardRef } from 'react'
import type { PersonalityResult } from '@/types/personality'

interface ShareCardProps {
  result: PersonalityResult
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function safePercent(value: unknown): number {
  const n = Number(value)
  if (isNaN(n) || !isFinite(n)) return 50
  return Math.round(Math.max(3, Math.min(97, n * 100)))
}

function formatGenre(genre: string): string {
  if (!genre) return ''
  const special: Record<string, string> = {
    'kollywood': 'Kollywood', 'tollywood': 'Tollywood',
    'mollywood': 'Mollywood', 'bollywood': 'Bollywood',
    'k-pop': 'K-Pop', 'r&b': 'R&B', 'edm': 'EDM',
    'lo-fi': 'Lo-Fi', 'hip hop': 'Hip-Hop', 'hip-hop': 'Hip-Hop',
    'uk garage': 'UK Garage', 'indian classical': 'Indian Classical',
    'indian folk': 'Indian Folk', 'carnatic': 'Carnatic',
    'hindustani': 'Hindustani', 'afrobeats': 'Afrobeats',
    'c-pop': 'C-Pop', 'j-pop': 'J-Pop', 'j-rock': 'J-Rock',
  }
  const lower = genre.toLowerCase()
  if (special[lower]) return special[lower]
  return genre.split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function formatName(name: string | null | undefined): string {
  if (!name) return ''
  return name.split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

// ─── Archetype gradient themes (works for ALL 8 archetypes) ──────────────────
const ARCHETYPE_THEMES: Record<string, {
  bg: string
  glow: string
  accent: string
}> = {
  'nocturnal-dreamer': {
    bg: 'linear-gradient(160deg, #1a0533 0%, #0d1b4b 50%, #1a0533 100%)',
    glow: '#7c3aed',
    accent: '#a78bfa',
  },
  'hype-machine': {
    bg: 'linear-gradient(160deg, #1a1a00 0%, #4a1a00 50%, #1a0a00 100%)',
    glow: '#f59e0b',
    accent: '#fbbf24',
  },
  'emotional-architect': {
    bg: 'linear-gradient(160deg, #2d0a1e 0%, #1a0533 50%, #2d0a1e 100%)',
    glow: '#ec4899',
    accent: '#f472b6',
  },
  'indie-wanderer': {
    bg: 'linear-gradient(160deg, #0a1f0a 0%, #1f1000 50%, #0a1a0a 100%)',
    glow: '#10b981',
    accent: '#34d399',
  },
  'bass-addict': {
    bg: 'linear-gradient(160deg, #00103d 0%, #3d002b 50%, #00103d 100%)',
    glow: '#3b82f6',
    accent: '#60a5fa',
  },
  'genre-scientist': {
    bg: 'linear-gradient(160deg, #002b2b 0%, #003322 50%, #002b2b 100%)',
    glow: '#10b981',
    accent: '#34d399',
  },
  'heartbreak-connoisseur': {
    bg: 'linear-gradient(160deg, #1f0000 0%, #0f0f0f 50%, #1a0000 100%)',
    glow: '#ef4444',
    accent: '#f87171',
  },
  'mainstream-maven': {
    bg: 'linear-gradient(160deg, #2b2200 0%, #1a1500 50%, #2b2200 100%)',
    glow: '#f59e0b',
    accent: '#fcd34d',
  },
}

function getTheme(archetypeId: string) {
  return ARCHETYPE_THEMES[archetypeId] ?? {
    bg: 'linear-gradient(160deg, #0b0b1a 0%, #1a0b2e 50%, #0b0b1a 100%)',
    glow: '#8b5cf6',
    accent: '#a78bfa',
  }
}

// ─── Mood bar config ──────────────────────────────────────────────────────────
const MOOD_BARS = [
  { left: 'SAD', right: 'HAPPY', key: 'happiness' as const,
    color: '#a78bfa', track: 'rgba(167,139,250,0.15)' },
  { left: 'CALM', right: 'ENERGETIC', key: 'energy' as const,
    color: '#f472b6', track: 'rgba(244,114,182,0.15)' },
  { left: 'ACOUSTIC', right: 'ELECTRONIC', key: 'acoustic' as const,
    color: '#22d3ee', track: 'rgba(34,211,238,0.15)' },
]

// ─── Genre pill colors (cycles for any number of genres) ─────────────────────
const PILL_STYLES = [
  { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.35)', text: '#c4b5fd' },
  { bg: 'rgba(244,114,182,0.15)', border: 'rgba(244,114,182,0.35)', text: '#f9a8d4' },
  { bg: 'rgba(34,211,238,0.15)',  border: 'rgba(34,211,238,0.35)',  text: '#67e8f9' },
  { bg: 'rgba(251,191,36,0.15)',  border: 'rgba(251,191,36,0.35)',  text: '#fde68a' },
  { bg: 'rgba(52,211,153,0.15)',  border: 'rgba(52,211,153,0.35)',  text: '#6ee7b7' },
]

// ─── Main Component ───────────────────────────────────────────────────────────
export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  ({ result }, ref) => {
    if (!result) return null

    console.log('[SHARECARD DEBUG]', {
      user: result?.user,
      username: result?.user?.username
    });

    const { archetype, alterEgo, summary, moodSpectrum, genreDNA, user } = result
    const theme = getTheme(archetype?.id ?? '')
    const topGenres = (genreDNA ?? []).slice(0, 3)
    const displayName = formatName(user?.username ?? '')

    // Safe defaults — never undefined
    const safeAlterEgo = alterEgo || 'Sonic Wanderer'
    const safeSummary = summary || 'A unique musical soul with eclectic taste.'
    const safeName = archetype?.name || 'The Music Lover'
    const safeEmoji = archetype?.emoji || '🎵'

    return (
      <div
        ref={ref}
        style={{
          width: '400px',
          minHeight: '700px',
          background: theme.bg,
          borderRadius: '24px',
          padding: '28px',
          fontFamily: "'Inter', -apple-system, sans-serif",
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          color: 'white',
          boxSizing: 'border-box',
        }}
      >
        {/* ── Glow orbs background ─────────────────────────────────── */}
        <div style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: '200px', height: '200px', borderRadius: '50%',
          background: theme.glow,
          opacity: 0.12, filter: 'blur(60px)',
          pointerEvents: 'none', zIndex: 0,
        }} />
        <div style={{
          position: 'absolute', bottom: '-40px', left: '-40px',
          width: '160px', height: '160px', borderRadius: '50%',
          background: theme.accent,
          opacity: 0.08, filter: 'blur(50px)',
          pointerEvents: 'none', zIndex: 0,
        }} />

        {/* ── TOP BAR ──────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', marginBottom: '22px',
          position: 'relative', zIndex: 1,
        }}>
          <div>
            <div style={{
              fontSize: '10px', letterSpacing: '0.16em',
              color: 'rgba(255,255,255,0.5)',
              marginBottom: '4px',
              textTransform: 'uppercase',
            }}>
              Music Persona
            </div>
            <div style={{
              fontSize: '22px', fontWeight: 800,
              color: 'white', lineHeight: 1.1,
              letterSpacing: '-0.01em',
            }}>
              Your sonic self
            </div>
          </div>
          {/* Emoji — no box, just floating */}
          <div style={{
            fontSize: '44px', lineHeight: 1,
            filter: `drop-shadow(0 4px 12px ${theme.glow}88)`,
            marginTop: '-4px',
          }}>
            {safeEmoji}
          </div>
        </div>

        {/* ── ARCHETYPE CARD ───────────────────────────────────────── */}
        <div style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '18px',
          marginBottom: '12px', position: 'relative',
          zIndex: 1, overflow: 'hidden',
        }}>
          {/* Subtle accent line top */}
          <div style={{
            position: 'absolute', top: 0, left: '20px', right: '20px',
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${theme.accent}66, transparent)`,
          }} />
          <div style={{
            fontSize: '10px', letterSpacing: '0.14em',
            color: 'rgba(255,255,255,0.45)',
            marginBottom: '8px', textTransform: 'uppercase',
          }}>
            Archetype
          </div>
          <div style={{
            fontSize: '26px', fontWeight: 800,
            color: 'white', marginBottom: '4px',
            lineHeight: 1.15, letterSpacing: '-0.02em',
          }}>
            {safeName}
          </div>
          <div style={{
            fontSize: '13px', fontStyle: 'italic',
            color: theme.accent, opacity: 0.9,
            letterSpacing: '0.01em',
          }}>
            {safeAlterEgo}
          </div>
        </div>

        {/* ── TOP GENRES CARD ──────────────────────────────────────── */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '16px',
          marginBottom: '12px', position: 'relative', zIndex: 1,
        }}>
          <div style={{
            fontSize: '10px', letterSpacing: '0.14em',
            color: 'rgba(255,255,255,0.45)',
            marginBottom: '12px', textTransform: 'uppercase',
          }}>
            Top Genres
          </div>
          {topGenres.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
              {topGenres.map((g, i) => {
                const style = PILL_STYLES[i % PILL_STYLES.length]
                return (
                  <div key={g.genre} style={{
                    background: style.bg,
                    border: `1px solid ${style.border}`,
                    borderRadius: '999px',
                    padding: '4px 12px',
                    fontSize: '12px',
                    color: style.text,
                    fontWeight: 500,
                    letterSpacing: '0.02em',
                  }}>
                    {formatGenre(g.genre)} · {g.percentage}%
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.4)',
              fontStyle: 'italic',
            }}>
              Eclectic listener — genre-free spirit
            </div>
          )}
        </div>

        {/* ── MOOD SPECTRUM CARD ───────────────────────────────────── */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '16px',
          marginBottom: '12px', position: 'relative', zIndex: 1,
        }}>
          <div style={{
            fontSize: '10px', letterSpacing: '0.14em',
            color: 'rgba(255,255,255,0.45)',
            marginBottom: '14px', textTransform: 'uppercase',
          }}>
            Mood Spectrum
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
            {MOOD_BARS.map(({ left, right, key, color, track }) => {
              const pct = safePercent(moodSpectrum?.[key])
              return (
                <div key={left}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: '9px', letterSpacing: '0.1em',
                    color: 'rgba(255,255,255,0.5)',
                    marginBottom: '5px',
                    textTransform: 'uppercase',
                  }}>
                    <span>{left}</span>
                    <span style={{ color, opacity: 1, fontWeight: 600 }}>
                      {pct}%
                    </span>
                    <span>{right}</span>
                  </div>
                  {/* Track */}
                  <div style={{
                    width: '100%', height: '5px',
                    backgroundColor: track,
                    borderRadius: '999px', overflow: 'hidden',
                  }}>
                    {/* Fill */}
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      backgroundColor: color,
                      borderRadius: '999px',
                      minWidth: '6px',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── PERSONALITY SUMMARY CARD ─────────────────────────────── */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '16px', padding: '16px',
          position: 'relative', zIndex: 1, flex: 1,
        }}>
          <div style={{
            fontSize: '10px', letterSpacing: '0.14em',
            color: 'rgba(255,255,255,0.4)',
            marginBottom: '10px', textTransform: 'uppercase',
          }}>
            What your taste says about you
          </div>
          <div style={{
            fontSize: '13px', lineHeight: 1.65,
            color: 'rgba(255,255,255,0.88)',
          }}>
            {safeSummary}
          </div>
        </div>

        {/* ── FOOTER ───────────────────────────────────────────────── */}
        <div style={{
          marginTop: '16px', position: 'relative', zIndex: 1,
          textAlign: 'center',
        }}>
          {/* Separator */}
          <div style={{
            width: '48px', height: '1px',
            background: 'rgba(255,255,255,0.18)',
            margin: '0 auto 12px auto',
          }} />
          {displayName && (
            <div style={{
              fontSize: '15px', fontWeight: 700,
              color: 'rgba(255,255,255,0.95)',
              marginBottom: '3px', letterSpacing: '0.01em',
            }}>
              {displayName}
            </div>
          )}
          <div style={{
            fontSize: '10px',
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: '0.08em',
          }}>
            music-persona.vercel.app
          </div>
        </div>
      </div>
    )
  }
)

ShareCard.displayName = 'ShareCard'
export default ShareCard
