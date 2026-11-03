import { router } from '@inertiajs/react';
import Lenis from 'lenis';
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { usePrefersReducedMotion } from '@/hooks/use-media-query';
import { gsap, ScrollTrigger } from '@/lib/gsap';

const LenisContext = createContext<Lenis | null>(null);

/**
 * The active Lenis instance, or null when smooth scrolling is off
 * (reduced motion, SSR, or before mount). Scroll position is always
 * the native window scroll, so code that reads window.scrollY keeps working.
 */
export function useLenis(): Lenis | null {
    return useContext(LenisContext);
}

/**
 * Smooth scrolling with Lenis, driven by GSAP's ticker so Lenis and
 * ScrollTrigger update in the same frame.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
    const reducedMotion = usePrefersReducedMotion();
    const [lenis, setLenis] = useState<Lenis | null>(null);

    useEffect(() => {
        if (reducedMotion) {
            return;
        }

        const instance = new Lenis({ autoRaf: false });
        const tick = (time: number) => instance.raf(time * 1000);

        instance.on('scroll', () => ScrollTrigger.update());
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);

        // Inertia resets or restores the window scroll before firing `navigate`.
        // Jump Lenis to that position so it doesn't animate back to the old page's
        // offset, then let ScrollTrigger measure the new page.
        const removeNavigateListener = router.on('navigate', () => {
            instance.scrollTo(window.scrollY, { immediate: true, force: true });
            requestAnimationFrame(() => ScrollTrigger.refresh());
        });

        setLenis(instance);

        return () => {
            removeNavigateListener();
            gsap.ticker.remove(tick);
            instance.destroy();
            setLenis(null);
        };
    }, [reducedMotion]);

    return (
        <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
    );
}
