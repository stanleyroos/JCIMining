import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#2EA3F2',
          'blue-dark': '#1a7bc0',
          'blue-light': '#5bb8f5',
          dark: '#1a1a2e',
          'dark-2': '#16213e',
          'dark-3': '#0f3460',
        },
      },
      fontFamily: {
        sans: ['Kumbh Sans', 'Montserrat', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
