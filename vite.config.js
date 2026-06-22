import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: [
        'src/lib/formValidation.js',
        'src/lib/authRoles.js',
        'src/services/authService.js',
        'src/services/pengajuanService.js',
        'src/pages/login.jsx',
      ],
      exclude: ['src/**/*.test.{js,jsx}', 'src/test/**'],
    },
  },
})
