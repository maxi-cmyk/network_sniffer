module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        "surface-elevated": "var(--surface-elevated)",
        primary: "var(--primary)",
        "primary-glow": "var(--primary-glow)",
        "primary-dim": "var(--primary-dim)",
        secondary: "var(--secondary)",
        "secondary-glow": "var(--secondary-glow)",
        "secondary-dim": "var(--secondary-dim)",
        tertiary: "var(--tertiary)",
        "tertiary-glow": "var(--tertiary-glow)",
        "text-muted": "var(--text-muted)",
        "text-dim": "var(--text-dim)",
        border: "var(--border)",
        "border-glow": "var(--border-glow)",
      },
      fontFamily: {
        display: ["Orbitron", "sans-serif"],
        tech: ["JetBrains Mono", "Fira Code", "monospace"],
        body: ["Inter", "sans-serif"],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'waveform': 'waveform-sweep 0.5s ease-in-out infinite',
        'glitch': 'glitch 0.3s ease-in-out',
        'flicker': 'phosphor-flicker 4s infinite',
        'crt-on': 'crt-turn-on 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
};