import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: './',
  server: {
    // Bind IPv4 explicitly: on this machine Vite's default ([::1]) listens
    // on the IPv6 loopback only, where connections get refused.
    // For phone access over Wi-Fi use: npm run dev -- --host
    host: '127.0.0.1',
    port: 5173,
  },
})
