/**
 * The drop intro plays on every full page load of a page with the orb, but
 * not again when returning to it through client-side navigation. A reload
 * counts as a new visit.
 */
let played = false;

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
