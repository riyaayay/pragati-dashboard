// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          orange:       '#F97316',
          'orange-dark':'#EA6C00',
          'orange-light':'#FFF7ED',
          gray:         '#6B7280',
          dark:         '#1C1C1E',
        },
      },
    },
  },
  plugins: [],
}
export default config
