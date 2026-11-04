import { defineConfig } from '@playwright/test';

/**
 * Accessibility tests (tests/a11y). Uses the installed Chrome, and the dev
 * server (`composer run dev`), started here if it isn't running already.
 */
export default defineConfig({
    testDir: 'tests/a11y',
    timeout: 60_000,
    fullyParallel: true,
    workers: 4,
    reporter: [['list']],
    use: {
        baseURL: process.env.A11Y_BASE_URL ?? 'http://localhost:8000',
        channel: 'chrome',
        viewport: { width: 1440, height: 900 },
    },
    webServer: {
        command: 'composer run dev',
        url: 'http://localhost:8000',
        reuseExistingServer: true,
        timeout: 120_000,
    },
});
