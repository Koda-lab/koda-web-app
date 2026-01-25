import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./__tests__/integration/setup.ts'],
        exclude: ['**/node_modules/**', '**/e2e/**'], // Exclude E2E tests (Playwright)
        alias: {
            '@': resolve(__dirname, './')
        }
    },
})
