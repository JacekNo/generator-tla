import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import glsl from 'vite-plugin-glsl'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    glsl() // Dodajemy obsługę shaderów (masz to w package.json)
  ],
  // KLUCZOWE: Musi być nazwa Twojego repozytorium w slaszach
  base: '/generator-tla/', 
})