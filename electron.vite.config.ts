import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

// Electron file:// protocol doesn't support crossorigin CORS checks on ES modules.
// Remove crossorigin attributes from built HTML so module scripts load correctly.
const removeCrossorigin: Plugin = {
  name: 'remove-crossorigin',
  transformIndexHtml(html: string) {
    return html
      .replace(/ crossorigin/g, '')
      .replace(/<link rel="modulepreload"[^>]*>\s*/g, '')
  }
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    root: resolve(__dirname, 'src'),
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react(), removeCrossorigin],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/renderer/index.html'),
        }
      }
    }
  }
})
