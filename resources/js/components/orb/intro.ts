/**
 * The drop intro plays on every full page load of a page with the orb, but
 * not again when returning to it through client-side navigation. A reload
 * counts as a new visit. resources/views/app.blade.php hides the hero text
 * before first paint on full loads, so keep the classes in sync.
 */
let played = false;

/** On <html> while the hero text waits for the orb's impact to reveal it. */
export const INTRO_PENDING_CLASS = 'orb-intro';

/** On <html> once the intro is driving the reveal; cancels the CSS fallback. */
export const INTRO_RUNNING_CLASS = 'orb-intro-running';

/** The element revealed from the orb's point of impact. */
export const REVEAL_SELECTOR = '[data-orb-reveal]';

export function shouldPlayIntro(): boolean {
    return (
        typeof window !== 'undefined' &&
        !played &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
}

export function markIntroPlayed(): void {
    played = true;
}

export function clearIntroClasses(): void {
    document.documentElement.classList.remove(
        INTRO_PENDING_CLASS,
        INTRO_RUNNING_CLASS,
    );
}
