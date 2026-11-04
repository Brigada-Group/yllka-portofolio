import { useSyncExternalStore } from 'react';

/**
 * Reduced motion: on when the visitor's system asks for it, or when they
 * turn on the site's own "Reduce motion" toggle (in the footer). The toggle
 * is kept in localStorage and set on <html data-motion="reduce"> before first
 * paint by the inline script in app.blade.php, so CSS can follow it too.
 */
const STORAGE_KEY = 'motion';
const QUERY = '(prefers-reduced-motion: reduce)';

/** True when the system setting asks for reduced motion (the site toggle can't override it). */
export function systemReducesMotion(): boolean {
    return window.matchMedia(QUERY).matches;
}

/** True when the site's own toggle is on. */
export function siteReducesMotion(): boolean {
    return document.documentElement.dataset.motion === 'reduce';
}

/** Reduced motion from either source. For code outside React. */
export function prefersReducedMotion(): boolean {
    return (
        typeof window !== 'undefined' &&
        (systemReducesMotion() || siteReducesMotion())
    );
}

function subscribe(onChange: () => void): () => void {
    const media = window.matchMedia(QUERY);
    const observer = new MutationObserver(onChange);
    media.addEventListener('change', onChange);
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-motion'],
    });

    return () => {
        media.removeEventListener('change', onChange);
        observer.disconnect();
    };
}

/** Reduced motion from either source, updating live. False on the server. */
export function useReducedMotion(): boolean {
    return useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
}

/** The site toggle's own state, updating live. */
export function useSiteReducesMotion(): boolean {
    return useSyncExternalStore(subscribe, siteReducesMotion, () => false);
}

/** The system setting, updating live. */
export function useSystemReducesMotion(): boolean {
    return useSyncExternalStore(subscribe, systemReducesMotion, () => false);
}

export function setSiteReducesMotion(reduce: boolean) {
    const root = document.documentElement;

    if (reduce) {
        root.dataset.motion = 'reduce';
    } else {
        delete root.dataset.motion;
    }

    try {
        if (reduce) {
            window.localStorage.setItem(STORAGE_KEY, 'reduce');
        } else {
            window.localStorage.removeItem(STORAGE_KEY);
        }
    } catch {
        // Storage can be unavailable (private mode); the choice then lasts this page only.
    }
}
