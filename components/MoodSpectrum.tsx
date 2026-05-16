'use client'

interface Props {
  valence: number
  energy: number
  acousticness: number
}

const BARS = [
  { left: 'SAD', right: 'HAPPY', color: '#a78bfa' },      // purple
  { left: 'CALM', right: 'ENERGETIC', color: '#f472b6' }, // pink
  { left: 'ACOUSTIC', right: 'ELECTRONIC', color: '#22d3ee' }, // cyan
]

export function MoodSpectrum({ valence, energy, acousticness }: Props) {
  const values = [
    Math.max(0.05, Math.min(0.95, isNaN(valence) ? 0.42 : valence)),
    Math.max(0.05, Math.min(0.95, isNaN(energy) ? 0.42 : energy)),
    Math.max(0.05, Math.min(0.95, isNaN(acousticness) ? 0.58 : 1 - acousticness)),
  ]

  return (
    <div className="glass rounded-3xl p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Mood Spectrum</h3>
        <span className="text-xs uppercase tracking-[0.24em] text-white/45">Audio DNA</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {BARS.map(({ left, right, color }, i) => {
          const pct = Math.round(values[i] * 100)
          return (
            <div key={left}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                letterSpacing: '0.1em',
                color: '#8b8a9a',
                marginBottom: '6px',
              }}>
                <span>{left}</span>
                <span style={{ color }}>{pct}%</span>
                <span>{right}</span>
              </div>
              {/* Track */}
              <div style={{
                width: '100%',
                height: '6px',
                backgroundColor: color + '30',  // 19% opacity track
                borderRadius: '999px',
                overflow: 'hidden',
              }}>
                {/* Fill — THIS must have explicit backgroundColor */}
                <div style={{
                  width: `${pct}%`,          // e.g. "42%"
                  height: '100%',
                  backgroundColor: color,    // explicit hex, no CSS var
                  borderRadius: '999px',
                  minWidth: '4px',           // always visible even at 1%
                }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

