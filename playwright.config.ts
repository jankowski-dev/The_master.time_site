import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'npm run build && npm run start',
    port: 4321,
    reuseExistingServer: !process.env.CI,
    env: {
      PORT: '4321',
      SITE_URL: 'http://localhost:4321',
      LEAD_TEST_MODE: '1'
    }
  }
});
