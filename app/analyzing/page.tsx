'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSteps } from '@/components/LoadingSteps';

export default function AnalyzingPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => router.push('/result'), 3000);
    return () => window.clearTimeout(timer);
  }, [router]);

  return (
    <main className="page-shell flex min-h-screen items-center justify-center py-12">
      <div className="w-full max-w-2xl text-center">
        <p className="mb-4 text-xs uppercase tracking-[0.36em] text-white/45">Please wait</p>
        <h1 className="text-4xl font-semibold sm:text-5xl">
          Building your <span className="gradient-text">music persona</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-white/60">We are analyzing your Spotify listening patterns and turning them into a personality profile.</p>
        <div className="mt-10 flex justify-center">
          <LoadingSteps
            steps={[
              'Fetching your top tracks...',
              'Analyzing audio features...',
              'Calculating your music DNA...',
              'Building your persona...'
            ]}
          />
        </div>
      </div>
    </main>
  );
}
