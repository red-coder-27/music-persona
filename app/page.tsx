import Link from 'next/link';
import { SpotifySignInButton } from '@/components/SpotifySignInButton';

const examples = [
  { name: 'The Nocturnal Dreamer', blurb: 'Late-night acoustic loops with cinematic mood.' },
  { name: 'The Hype Machine', blurb: 'Fast, loud, and built for instant adrenaline.' },
  { name: 'The Indie Wanderer', blurb: 'Deep cuts, warm textures, and low-key discovery.' }
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 opacity-70">
        <div className="absolute left-8 top-20 h-72 w-72 animate-floaty rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute right-4 top-40 h-80 w-80 animate-floaty rounded-full bg-orange-500/15 blur-3xl [animation-delay:1.5s]" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 animate-floaty rounded-full bg-violet-500/15 blur-3xl [animation-delay:3s]" />
      </div>

      <div className="relative page-shell flex min-h-screen flex-col justify-between py-8 sm:py-10">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/45">Music Persona</p>
          </div>
          <SpotifySignInButton className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur hover:bg-white/10">
            Connect Spotify
          </SpotifySignInButton>
        </header>

        <section className="grid items-center gap-14 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-4 py-2 text-sm text-fuchsia-200 backdrop-blur">
              Spotify Wrapped-style personality analysis
            </div>
            <h1 className="text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Discover Your <span className="gradient-text">Music DNA</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65 sm:text-xl">
              Find out what your Spotify listening habits say about you.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <SpotifySignInButton className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-orange-400 px-7 py-4 text-base font-semibold text-black shadow-glow transition hover:scale-[1.02]">
                Connect Spotify
              </SpotifySignInButton>
              <a href="#preview" className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-7 py-4 text-base font-semibold text-white/85 backdrop-blur transition hover:bg-white/10">
                See demo personas
              </a>
            </div>
          </div>

          <div id="preview" className="grid gap-4 lg:justify-self-end">
            {examples.map((item, index) => (
              <div key={item.name} className={`glass w-full max-w-md rounded-[1.75rem] p-5 transition hover:-translate-y-1 ${index === 0 ? 'animate-floaty' : index === 1 ? 'animate-floaty [animation-delay:1.2s]' : 'animate-floaty [animation-delay:2.4s]'}`}>
                <div className="mb-4 flex items-center justify-between">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500/70 to-orange-400/70 text-xl">
                    {index === 0 ? '🌙' : index === 1 ? '⚡' : '🌿'}
                  </div>
                  <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs uppercase tracking-[0.22em] text-white/50 blur-[0.2px]">
                    Demo
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white blur-[1.4px]">{item.name}</h3>
                <p className="mt-2 text-sm text-white/50 blur-[1.4px]">{item.blurb}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
