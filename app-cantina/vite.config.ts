import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Expõe o servidor na rede
    port: 5173, // Porta fixa
    strictPort: true, // Falha se a porta estiver ocupada
  },
})
