'use client';

import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { GenreCount } from '@/types/spotify';

type GenreChartProps = {
  genres: GenreCount[];
};

const COLORS = ['#a855f7', '#ec4899', '#f97316', '#22c55e', '#06b6d4'];

export function GenreChart({ genres }: GenreChartProps) {
  const values = genres.slice(0, 5).map((genre) => ({ name: genre.genre, value: genre.percentage }));

  if (!values.length) {
    return (
      <div className="glass rounded-3xl p-6">
        <p className="text-white/65">Genres unavailable — try listening more or check privacy settings.</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Genre DNA</h3>
        <span className="text-xs uppercase tracking-[0.24em] text-white/45">Top 5</span>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={values}
              dataKey="value"
              innerRadius="60%"
              outerRadius="92%"
              paddingAngle={4}
              stroke="none"
            >
              {values.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'rgba(9, 9, 11, 0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 16,
                color: '#fff'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {values.map((genre, index) => (
          <span
            key={genre.name}
            className={`rounded-full border border-white/10 px-3 py-1 text-xs text-white/80 ${
              index === 0 ? 'bg-fuchsia-500/15' : index === 1 ? 'bg-pink-500/15' : index === 2 ? 'bg-orange-500/15' : index === 3 ? 'bg-emerald-500/15' : 'bg-cyan-500/15'
            }`}
          >
            {genre.name} · {genre.value}%
          </span>
        ))}
      </div>
    </div>
  );
}
