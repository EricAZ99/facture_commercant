import { defineConfig, devices } from '@playwright/test'

/**
 * Tests E2E des parcours critiques, executes contre le backend factice
 * (`mock-server/`) + le serveur de dev Vite — jamais contre un backend de
 * production. `workers: 1` : plusieurs specs partagent le compte de demo
 * (donnees en memoire), on evite donc toute execution parallele qui
 * introduirait des collisions/flakiness entre fichiers de test.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'list' : 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm start',
      cwd: './mock-server',
      url: 'http://localhost:4000/health',
      reuseExistingServer: !process.env.CI,
      timeout: 30000
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 30000
    }
  ]
})
