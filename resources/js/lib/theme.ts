import { useSyncExternalStore } from 'react';

export type Theme = 'dark' | 'light';

/** Where the visitor's explicit choice is kept. Also read by the inline script in app.blade.php. */
const STORAGE_KEY = 'theme';
/** How long the circular reveal takes, in ms. */
const REVEAL_DURATION = 500;

function currentTheme(): Theme {
    return document.documentElement.dataset.theme === 'light'
        ? 'light'
        : 'dark';
}

/** Watches <html data-theme>, so every subscriber updates on a switch (from any tab of code). */
function subscribe(onChange: () => void): () => void {
    const observer = new MutationObserver(onChange);
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
}

/** The active theme. Dark on the server and until hydrated, like the page itself. */
export function useTheme(): Theme {
    return useSyncExternalStore(subscribe, currentTheme, () => 'dark');
}

function applyTheme(theme: Theme) {
    const root = document.documentElement;
    root.dataset.theme = theme;

    try {
        window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
        // Storage can be unavailable (private mode); the choice then lasts this page only.
    }

    // The browser UI colour follows the page background.
    document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute(
            'content',
            getComputedStyle(root)
                .getPropertyValue('--theme-background')
                .trim(),
        );
}

/**
 * Switches the theme. Where the View Transitions API is supported (and
 * motion is welcome), the new theme is revealed as a circle growing from
 * `origin` (the toggle); otherwise it switches at once.
 */
export function setTheme(theme: Theme, origin?: { x: number; y: number }) {
    const reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
    ).matches;

    if (!document.startViewTransition || reducedMotion || !origin) {
        applyTheme(theme);

        return;
    }

    const radius = Math.hypot(
        Math.max(origin.x, window.innerWidth - origin.x),
        Math.max(origin.y, window.innerHeight - origin.y),
    );
    const transition = document.startViewTransition(() => applyTheme(theme));

    void transition.ready.then(() => {
        document.documentElement.animate(
            {
                clipPath: [
                    `circle(0px at ${origin.x}px ${origin.y}px)`,
                    `circle(${radius}px at ${origin.x}px ${origin.y}px)`,
                ],
            },
            {
                duration: REVEAL_DURATION,
                easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
                pseudoElement: '::view-transition-new(root)',
            },
        );
    });
}
