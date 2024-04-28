import type { Config } from 'tailwindcss'
const colors = require('tailwindcss/colors')

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: theme => ({
        'gradient-linear': 'linear-gradient(to right, var(--hot-pink), var(--bright-teal))',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      }),
      colors: {
        ...colors,
        'red': colors.red,
        'hot-pink': 'var(--hot-pink)',
        'bright-teal': 'var(--bright-teal)',
        'neon-blue': 'var(--neon-blue)',
        'neon-orange' : 'var(--neon-orange)',
        'bright-purple': 'var(--bright-purple)',
        'dark-grey-1': 'var(--dark-grey-1)',
        'dark-grey-2': 'var(--dark-grey-2)',
      },
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif']
      }
    },
  },
  plugins: [],
}
export default config
