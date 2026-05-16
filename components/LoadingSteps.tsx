'use client';

import { useEffect, useMemo, useState } from 'react';

type LoadingStepsProps = {
  steps: string[];
  durationMs?: number;
};

export function LoadingSteps({ steps, durationMs = 3000 }: LoadingStepsProps) {
  const [active, setActive] = useState(0);
  const interval = useMemo(() => Math.max(450, Math.floor(durationMs / Math.max(steps.length, 1))), [durationMs, steps.length]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => Math.min(current + 1, steps.length - 1));
    }, interval);

    return () => window.clearInterval(timer);
  }, [interval, steps.length]);

  return (
    <div className="glass w-full max-w-xl rounded-3xl p-6 sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="h-3 w-3 animate-pulse rounded-full bg-fuchsia-400" />
        <p className="text-sm uppercase tracking-[0.3em] text-white/50">Analyzing your sound</p>
      </div>
      <div className="space-y-3">
        {steps.map((step, index) => {
          const complete = index <= active;
          return (
            <div
              key={step}
              className={`flex items-center gap-4 rounded-2xl border px-4 py-4 transition-all ${
                complete ? 'border-fuchsia-400/30 bg-fuchsia-400/10' : 'border-white/10 bg-white/5 opacity-65'
              }`}
            >
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold ${
                  complete ? 'bg-gradient-to-r from-fuchsia-500 to-orange-400 text-black' : 'bg-white/10 text-white/60'
                }`}
              >
                {complete ? '✓' : index + 1}
              </span>
              <div>
                <p className="font-medium text-white">{step}</p>
                <p className="text-sm text-white/55">{complete ? 'Complete' : 'In progress...'}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
