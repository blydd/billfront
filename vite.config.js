import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import postcssConfig from './postcss.config.js'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    uni(),
  ],
  css: {
    postcss: postcssConfig
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://yqccrdqeszui.sealosbja.site',
        changeOrigin: true,
        rewrite: (path) => path
      }
    }
  }
})
