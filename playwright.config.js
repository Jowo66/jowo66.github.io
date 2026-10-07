// Playwright settings: how the robot browser runs your tests.
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  // Starts a tiny local web server so the tests can open your site.
  webServer: {
    command: 'python3 -m http.server 8765',
    url: 'http://localhost:8765/index.html',
    reuseExistingServer: true,
  },
  use: {
    baseURL: 'http://localhost:8765',
    // Only needed in some sandboxes; on your own computer and on GitHub this is empty.
    launchOptions: process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {},
  },
});
