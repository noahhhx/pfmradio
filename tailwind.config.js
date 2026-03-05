/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: '#1e1e2e',
        mantle: '#181825',
        crust: '#11111b',
        surface0: '#313244',
        surface1: '#45475a',
        text: '#cdd6f4',
        subtext: '#a6adc8',
        lavender: '#b4befe',
        blue: '#89b4fa',
        sky: '#74c7ec',
        green: '#a6e3a1',
        yellow: '#f9e2af',
        peach: '#fab387',
        red: '#f38ba8',
        mauve: '#cba6f7',
      }
    },
  },
  plugins: [],
}
