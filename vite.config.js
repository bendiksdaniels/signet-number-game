import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Builds to ONE self-contained index.html (JS + CSS inlined) that drops into
// kub.org/sb_game/ exactly like the current build. Assets up to ~512kb inline
// as data-URIs so the logo travels inside the single file too.
export default defineConfig({
  // Relative base so the single-file build works when served from a GitHub Pages
  // subpath (https://user.github.io/<repo>/) as well as from a domain root.
  base: './',
  plugins: [react(), viteSingleFile()],
  build: {
    assetsInlineLimit: 512 * 1024,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 4096,
  },
})
