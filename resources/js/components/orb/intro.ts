/**
 * The drop intro plays once per browser session. resources/views/app.blade.php
 * runs the same check inline before first paint, so keep the key and classes in sync.
 */
export const INTRO_STORAGE_KEY = 'orb-intro-played';

/** On <html> while the hero text waits for the ripple to reveal it. */
export const INTRO_PENDING_CLASS = 'orb-intro';

/** On <html> once the intro is driving the reveal; cancels the CSS fallback. */
export const INTRO_RUNNING_CLASS = 'orb-intro-running';

/** The element revealed by the impact ripple. */
export const REVEAL_SELECTOR = '[data-orb-reveal]';

export function shouldPlayIntro(): boolean {
    if (typeof window === 'undefined') {
        return false;
    }

    try {
        return (
            !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
            window.sessionStorage.getItem(INTRO_STORAGE_KEY) === null
        );
    } catch {
        // Storage can be blocked (privacy modes). Skip the intro rather than replay it every visit.
        return false;
    }
}

export function markIntroPlayed(): void {
    try {
        window.sessionStorage.setItem(INTRO_STORAGE_KEY, '1');
    } catch {
        // Ignore: the intro may replay, which is harmless.
    }
}

export function clearIntroClasses(): void {
    document.documentElement.classList.remove(
        INTRO_PENDING_CLASS,
        INTRO_RUNNING_CLASS,
    );
}
