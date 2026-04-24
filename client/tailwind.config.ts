// import type { Config } from "tailwindcss";

// const config: Config = {
//   content: [
//     "./pages/**/*.{js,ts,jsx,tsx,mdx}",
//     "./components/**/*.{js,ts,jsx,tsx,mdx}",
//     "./app/**/*.{js,ts,jsx,tsx,mdx}",
//   ],
//   theme: {
//     extend: {
//       colors: {
//         cream: "#FAF7F2",
//         blush: "#E8C4B8",
//         rose: "#C4786A",
//         bark: "#6B4F3A",
//         obsidian: "#1A1410",
//         sage: "#8A9E8A",
//       },
//       fontFamily: {
//         display: ["var(--font-display)"],
//         body: ["var(--font-body)"],
//       },
//     },
//   },
//   plugins: [],
// };

// export default config;
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        amber: {
          DEFAULT: '#FF5F1F',
          soft:    '#F89880',
          honey:   'rgba(255,95,31,0.15)',
        },
        cyan: {
          DEFAULT: '#00FFFF',
          soft:    '#23D5D5',
          glass:   'rgba(0,255,255,0.08)',
        },
        brown:  '#542B21',
        dark: {
          DEFAULT: '#07050A',
          2:       '#0D0A05',
          card:    'rgba(255,255,255,0.025)',
          border:  'rgba(255,255,255,0.06)',
        },
        admin: {
          bg:      '#0A0A0F',
          surface: '#111118',
          border:  'rgba(255,255,255,0.08)',
        },
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'serif'],
        label:   ['Syncopate', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
      },
      backgroundImage: {
        'hero-cyan-dark':  "url('/images/hero-cyan-dark.jpg')",
        'hero-cyan-close': "url('/images/hero-cyan-close.jpg')",
        'hero-amber-side': "url('/images/hero-amber-side.jpg')",
        'hero-amber-front':"url('/images/hero-amber-front.jpg')",
        'intro-products':  "url('/images/intro-products.jpg')",
      },
      animation: {
        'fade-up':    'fadeUp 1s cubic-bezier(0.16,1,0.3,1) forwards',
        'orb-float':  'orbFloat 6s ease-in-out infinite alternate',
        'beam-pulse': 'beamPulse 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
export default config