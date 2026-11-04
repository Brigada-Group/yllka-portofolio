import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const PAGES = [
    { name: 'home', path: '/' },
    { name: 'projects', path: '/projects' },
    { name: 'project detail', path: '/projects/anthem' },
    { name: 'about', path: '/about' },
    { name: 'contact', path: '/contact' },
    { name: 'accessibility', path: '/accessibility' },
];

const THEMES = ['dark', 'light'] as const;

/** WCAG 2.0–2.2 A and AA, plus axe's best practices (landmarks, heading order…). */
const TAGS = [
    'wcag2a',
    'wcag2aa',
    'wcag21a',
    'wcag21aa',
    'wcag22aa',
    'best-practice',
];

for (const theme of THEMES) {
    for (const page of PAGES) {
        test(`${page.name} (${theme}) has no axe violations`, async ({
            page: browser,
        }) => {
            await browser.addInitScript((choice) => {
                window.localStorage.setItem('theme', choice);
            }, theme);

            const response = await browser.goto(page.path);
            expect(response?.status(), 'page loads').toBe(200);

            // Let fonts, the orb's intro and entrance animations settle.
            await browser.waitForTimeout(2500);

            const results = await new AxeBuilder({ page: browser })
                .withTags(TAGS)
                .analyze();

            const summary = results.violations.map(
                (violation) =>
                    `${violation.id} [${violation.impact}] ×${violation.nodes.length}: ${violation.help}\n` +
                    violation.nodes
                        .slice(0, 3)
                        .map((node) => `    ${node.target.join(' ')}`)
                        .join('\n'),
            );

            expect(summary, summary.join('\n')).toEqual([]);
        });
    }
}
