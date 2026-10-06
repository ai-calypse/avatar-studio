import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.AVATAR_TEST_PORT) || 4173;

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.mjs',
  reporter: 'line',
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    screenshot: 'only-on-failure',
    trace: process.env.CI ? 'retain-on-failure' : 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: `node scripts/serve.mjs --port ${port}`,
    url: `http://127.0.0.1:${port}/examples/basic.html`,
    reuseExistingServer: true,
  },
});
