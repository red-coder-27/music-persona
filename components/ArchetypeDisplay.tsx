import type { Archetype } from '@/types/personality';
import { getArchetypeThemeClass } from '@/lib/themingUtils';

type ArchetypeDisplayProps = {
  archetype: Archetype;
};

export function ArchetypeDisplay({ archetype }: ArchetypeDisplayProps) {
  return (
    <div className={`glass relative overflow-hidden rounded-[2rem] p-6 sm:p-8 ${getArchetypeThemeClass(archetype.id)}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_25%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_20%)]" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.32em] text-white/70">Listening Archetype</p>
          <h2 className="text-2xl font-semibold sm:text-3xl">
            <span className="mr-2">{archetype.emoji}</span>
            {archetype.name}
          </h2>
        </div>
        <div className="grid h-16 w-16 place-items-center rounded-2xl border border-white/20 bg-white/10 text-3xl shadow-2xl backdrop-blur">
          {archetype.emoji}
        </div>
      </div>
      <p className="relative mt-4 max-w-xl text-sm leading-6 text-white/85 sm:text-base">{archetype.summary}</p>
    </div>
  );
}
