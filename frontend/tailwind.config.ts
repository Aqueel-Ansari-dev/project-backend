import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        lg: '2rem'
      }
    },
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1f5eff',
          foreground: '#ffffff'
        }
      }
    }
  },
  plugins: [forms]
};

export default config;
