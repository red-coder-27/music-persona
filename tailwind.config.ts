import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      backgroundImage: {
        'spotlight-radial': 'radial-gradient(circle at top, rgba(168,85,247,0.25), transparent 35%), radial-gradient(circle at bottom right, rgba(236,72,153,0.18), transparent 25%)'
      },
      boxShadow: {
        glow: '0 0 60px rgba(168,85,247,0.22)'
      },
      keyframes: {
        floaty: {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(0,-14px,0) scale(1.06)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' }
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        floaty: 'floaty 8s ease-in-out infinite',
        shimmer: 'shimmer 8s linear infinite',
        fadeUp: 'fadeUp 0.55s ease-out both'
      }
    }
  },
  plugins: []
};

export default config;