import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/** Let fonts, the orb and entrance animations settle. */
const settle = (page: Page) => page.waitForTimeout(2000);

test.describe('keyboard and screen reader', () => {
    test('skip link comes first and moves focus to the main content', async ({
        page,
    }) => {
        await page.goto('/');
        await settle(page);
        await page.keyboard.press('Tab');

        const skip = page.getByRole('link', { name: 'Skip to content' });
        await expect(skip).toBeFocused();
        await expect(skip).toBeInViewport();

        await page.keyboard.press('Enter');
        await expect(page.locator('#main')).toBeFocused();
    });

    test('the hero h1 reads as the plain name', async ({ page }) => {
        await page.goto('/');

        await expect(
            page.getByRole('heading', {
                level: 1,
                name: 'Yllka Selimi',
                exact: true,
            }),
        ).toBeVisible();
        await expect(page.locator('h1')).toHaveCount(1);
    });

    test('nav links have clean names and move focus to their section', async ({
        page,
    }) => {
        await page.goto('/');
        await settle(page);
        const nav = page.getByRole('navigation', { name: 'Main' });

        for (const name of ['Work', 'About', 'Contact']) {
            await expect(
                nav.getByRole('link', { name, exact: true }),
            ).toHaveCount(1);
        }

        await nav.getByRole('link', { name: 'About', exact: true }).focus();
        await page.keyboard.press('Enter');
        await expect(page.locator('#about')).toBeFocused();
        await expect(page.locator('#about')).toBeInViewport();
        await expect(
            nav.getByRole('link', { name: 'About', exact: true }),
        ).toHaveAttribute('aria-current', 'page');
    });

    test('keyboard scrolling works with smooth scrolling on', async ({
        page,
    }) => {
        await page.goto('/');
        await settle(page);
        await page.locator('body').click({ position: { x: 5, y: 300 } });

        await page.keyboard.press('PageDown');
        await page.waitForTimeout(800);
        const afterPageDown = await page.evaluate(() => window.scrollY);
        expect(afterPageDown).toBeGreaterThan(300);

        await page.keyboard.press('Space');
        await page.waitForTimeout(800);
        expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(
            afterPageDown,
        );

        await page.keyboard.press('End');
        await page.waitForTimeout(1500);
        const atEnd = await page.evaluate(
            () =>
                window.scrollY + window.innerHeight >=
                document.documentElement.scrollHeight - 4,
        );
        expect(atEnd).toBe(true);

        await page.keyboard.press('Home');
        await page.waitForTimeout(1500);
        expect(await page.evaluate(() => window.scrollY)).toBeLessThan(4);

        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(500);
        expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    });

    test('tabbing to something below the fold scrolls it into view', async ({
        page,
    }) => {
        await page.goto('/');
        await settle(page);
        const email = page.locator('#contact a[href^="mailto:"]');
        await email.focus();
        await page.waitForTimeout(800);
        await expect(email).toBeInViewport();
    });

    test('client-side navigation focuses the new h1 and announces the title', async ({
        page,
    }) => {
        await page.goto('/about');
        await settle(page);
        await page
            .getByRole('contentinfo')
            .getByRole('link', { name: 'Accessibility' })
            .click();

        await expect(
            page.getByRole('heading', { level: 1, name: 'Accessibility' }),
        ).toBeFocused();
        await expect(page.locator('[aria-live="polite"]').last()).toContainText(
            'Accessibility',
        );
    });

    test('mobile menu traps focus, closes with Esc and returns focus', async ({
        page,
    }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto('/');
        await settle(page);
        const menuButton = page.getByRole('button', { name: 'Menu' });

        await menuButton.focus();
        await page.keyboard.press('Enter');
        await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
        const dialog = page.getByRole('dialog', { name: 'Menu' });
        await expect(dialog).toBeVisible();

        for (let i = 0; i < 12; i++) {
            await page.keyboard.press('Tab');
            expect(
                await page.evaluate(
                    () => !!document.activeElement?.closest('[role="dialog"]'),
                ),
            ).toBe(true);
        }

        await page.keyboard.press('Escape');
        await expect(dialog).toHaveCount(0);
        await expect(menuButton).toBeFocused();
    });

    test('theme toggle is a labelled, pressed-state button', async ({
        page,
    }) => {
        await page.goto('/');
        const toggle = page
            .getByRole('banner')
            .getByRole('button', { name: 'Switch to light mode' });

        await expect(toggle).toHaveAttribute('aria-pressed', 'false');
        await toggle.click();
        await expect(
            page
                .getByRole('banner')
                .getByRole('button', { name: 'Switch to dark mode' }),
        ).toHaveAttribute('aria-pressed', 'true');
    });

    test('skills can be paused, and screen readers get a plain list', async ({
        page,
    }) => {
        await page.goto('/');
        await settle(page);
        const pause = page.getByRole('button', {
            name: 'Pause the moving skills',
        });

        await pause.focus();
        await page.keyboard.press('Enter');
        await expect(
            page.getByRole('button', { name: 'Play the moving skills' }),
        ).toBeVisible();

        const items = page.locator('#skills ul li');
        expect(await items.count()).toBeGreaterThan(3);
        expect(
            await page
                .locator('#skills [data-marquee]')
                .first()
                .evaluate(
                    (element) => !!element.closest('[aria-hidden="true"]'),
                ),
        ).toBe(true);
    });

    test('reduce motion toggle is saved and stops the animations', async ({
        page,
    }) => {
        await page.goto('/');
        await settle(page);
        const toggle = page.getByRole('button', { name: 'Reduce motion' });

        await expect(toggle).toHaveAttribute('aria-pressed', 'false');
        await toggle.click();
        await expect(toggle).toHaveAttribute('aria-pressed', 'true');

        await page.reload();
        await expect(page.locator('html')).toHaveAttribute(
            'data-motion',
            'reduce',
        );
        await settle(page);
        // No marquee pause button: the rows don't move at all.
        await expect(
            page.getByRole('button', { name: 'Pause the moving skills' }),
        ).toHaveCount(0);
        // The orb stays on the ı: no drag handle.
        await expect(page.locator('#hero .cursor-grab')).toHaveCount(0);
    });

    test('contact form fields are labelled and required', async ({ page }) => {
        await page.goto('/contact');

        for (const label of ['Name', 'Email', 'Message']) {
            const field = page.getByLabel(label, { exact: true });
            await expect(field).toBeVisible();
            await expect(field).toHaveAttribute('required', '');
        }

        await expect(
            page.getByRole('button', { name: 'Send message' }),
        ).toHaveAttribute('type', 'submit');
    });

    test('latest work link has a clear name', async ({ page }) => {
        await page.goto('/');
        await expect(
            page.getByRole('link', { name: /^Latest work\s*:.+case study$/ }),
        ).toHaveCount(1);
    });

    test('decorative layers are hidden and never block clicks', async ({
        page,
    }) => {
        await page.goto('/');
        await settle(page);

        const canvas = page.locator('canvas').first();
        expect(
            await canvas.evaluate((element) => {
                const wrapper = element.closest('[aria-hidden]');
                return {
                    hidden:
                        !!wrapper ||
                        element.getAttribute('aria-hidden') === 'true',
                    pointer: getComputedStyle(element.parentElement!)
                        .pointerEvents,
                };
            }),
        ).toMatchObject({ hidden: true });

        for (const selector of ['.grain', '.hero-glow']) {
            const layer = page.locator(selector);
            await expect(layer).toHaveAttribute('aria-hidden', 'true');
            expect(
                await layer.evaluate(
                    (element) => getComputedStyle(element).pointerEvents,
                ),
            ).toBe('none');
        }
    });
});

test.describe('reflow and targets', () => {
    const pages = [
        '/',
        '/projects',
        '/projects/anthem',
        '/about',
        '/contact',
        '/accessibility',
    ];

    for (const [width, height, label] of [
        [320, 640, '320px wide'],
        [720, 450, '200% zoom of 1440×900'],
    ] as const) {
        test(`no horizontal scrolling at ${label}`, async ({ page }) => {
            await page.setViewportSize({ width, height });

            for (const path of pages) {
                await page.goto(path);
                await page.waitForTimeout(600);
                const overflow = await page.evaluate(
                    () =>
                        document.documentElement.scrollWidth -
                        window.innerWidth,
                );
                expect(
                    overflow,
                    `${path} overflows by ${overflow}px`,
                ).toBeLessThanOrEqual(0);
            }
        });
    }

    test('header and footer targets are at least 24px tall', async ({
        page,
    }) => {
        await page.goto('/');
        await settle(page);
        const small = await page.evaluate(() =>
            [
                ...document.querySelectorAll<HTMLElement>(
                    'header a, header button, footer a, footer button, #skills button',
                ),
            ]
                .filter((element) => element.offsetParent !== null)
                .map((element) => ({
                    name: element.textContent?.trim(),
                    height: element.getBoundingClientRect().height,
                }))
                .filter((target) => target.height < 24),
        );

        expect(small).toEqual([]);
    });
});
