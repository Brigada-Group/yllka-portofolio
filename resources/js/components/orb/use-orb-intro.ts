import { useLayoutEffect, useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import {
    clearIntroClasses,
    INTRO_PENDING_CLASS,
    INTRO_RUNNING_CLASS,
    markIntroPlayed,
    REVEAL_LINE_SELECTOR,
    REVEAL_SELECTOR,
} from './intro';
import type { OrbMotion } from './motion';
import type { OrbPathStore } from './types';

type OrbIntroOptions = {
    path: OrbPathStore | null;
    motion: OrbMotion;
    /** True once the canvas has been created, so the drop is actually visible. */
    ready: boolean;
    /** Whether the intro should play at all (see shouldPlayIntro). */
    enabled: boolean;
};

const SKIP_KEYS = new Set([
    ' ',
    'ArrowDown',
    'ArrowUp',
    'PageDown',
    'PageUp',
    'End',
    'Home',
]);

/**
 * The drop intro: the orb falls from above the viewport onto the first stop,
 * squashes, bounces twice and settles. As it lands, the hero headline's
 * lines slide up from behind their masks. Any scroll input skips straight to the end state.
 *
 * Everything is keyframed on one timeline, so skipping is just `progress(1)`.
 */
export function useOrbIntro({ path, motion, ready, enabled }: OrbIntroOptions) {
    const skipped = useRef(false);

    // Hide the hero text before paint when arriving through client-side
    // navigation (the inline <head> script covers full page loads), and
    // reveal it straight away if the visitor scrolls before the canvas is ready.
    useLayoutEffect(() => {
        if (!enabled) {
            return;
        }

        const root = document.documentElement;
        root.classList.add(INTRO_PENDING_CLASS);
        markIntroPlayed();

        const skipEarly = () => {
            skipped.current = true;
            motion.offsetY = 0;
            clearIntroClasses();
        };
        window.addEventListener('wheel', skipEarly, {
            once: true,
            passive: true,
        });
        window.addEventListener('touchmove', skipEarly, {
            once: true,
            passive: true,
        });

        return () => {
            window.removeEventListener('wheel', skipEarly);
            window.removeEventListener('touchmove', skipEarly);
            clearIntroClasses();
        };
    }, [enabled, motion]);

    useGSAP(
        () => {
            if (!enabled || !ready || !path) {
                return;
            }

            const layout = path.get();
            const hero = layout.stops[0];

            if (!hero || skipped.current || window.scrollY > 0) {
                motion.offsetY = 0;
                clearIntroClasses();

                return;
            }

            // Start fully above the viewport, so the orb drops in from off screen.
            const fall = hero.anchor.y + hero.radius * 3;
            const lines = Array.from(
                document.querySelectorAll<HTMLElement>(
                    `${REVEAL_SELECTOR} ${REVEAL_LINE_SELECTOR}`,
                ),
            );
            // If the CSS fallback already showed the text, play the drop without the reveal.
            const reveal =
                lines.length > 0 &&
                getComputedStyle(lines[0]).transform !== 'none';

            document.documentElement.classList.add(INTRO_RUNNING_CLASS);

            const finish = () => {
                clearIntroClasses();

                gsap.set(lines, { clearProps: 'transform' });
            };

            const tl = gsap.timeline();

            // Fall: accelerate under "gravity" and stretch with speed.
            tl.fromTo(
                motion,
                { offsetY: -fall, squash: 1 },
                { offsetY: 0, squash: 1.12, duration: 0.75, ease: 'power2.in' },
            );

            // First impact: squash, reveal, then rebound. Each bounce is placed
            // at a fixed time after impact, so the longer reveal tween can't
            // push the second bounce back and leave the orb sitting still.
            tl.addLabel('impact')
                .to(
                    motion,
                    { squash: 0.68, duration: 0.07, ease: 'power2.out' },
                    'impact',
                )
                .to(
                    motion,
                    { squash: 1.08, duration: 0.12, ease: 'power1.inOut' },
                    'impact+=0.07',
                )
                .to(
                    motion,
                    { squash: 1, duration: 0.2, ease: 'power1.out' },
                    'impact+=0.19',
                )
                // Bounce height falls off; time in the air scales with √height.
                .to(
                    motion,
                    {
                        offsetY: -fall * 0.16,
                        duration: 0.3,
                        ease: 'power2.out',
                    },
                    'impact+=0.05',
                )
                .to(
                    motion,
                    { offsetY: 0, duration: 0.3, ease: 'power2.in' },
                    'impact+=0.35',
                );

            // The headline's lines slide up from behind their masks, one after
            // the other, as the orb lands in its letter.
            if (reveal) {
                tl.fromTo(
                    lines,
                    { yPercent: 110 },
                    {
                        yPercent: 0,
                        duration: 1.1,
                        ease: 'expo.out',
                        stagger: 0.12,
                    },
                    'impact+=0.05',
                );
            }

            // Second, smaller bounce the moment the first one lands, then settle.
            tl.addLabel('impact2', 'impact+=0.65')
                .to(
                    motion,
                    { squash: 0.85, duration: 0.06, ease: 'power2.out' },
                    'impact2',
                )
                .to(
                    motion,
                    { squash: 1, duration: 0.18, ease: 'power1.out' },
                    'impact2+=0.06',
                )
                .to(
                    motion,
                    {
                        offsetY: -fall * 0.04,
                        duration: 0.17,
                        ease: 'power2.out',
                    },
                    'impact2+=0.03',
                )
                .to(
                    motion,
                    { offsetY: 0, duration: 0.17, ease: 'power2.in' },
                    'impact2+=0.2',
                )
                .to(
                    motion,
                    { squash: 0.94, duration: 0.05, ease: 'power2.out' },
                    'impact2+=0.37',
                )
                .to(
                    motion,
                    { squash: 1, duration: 0.4, ease: 'elastic.out(1, 0.5)' },
                    'impact2+=0.42',
                );

            // Skip on any scroll input.
            const skip = (event: Event) => {
                if (
                    event instanceof KeyboardEvent &&
                    !SKIP_KEYS.has(event.key)
                ) {
                    return;
                }

                tl.progress(1);
                finish();
                removeSkipListeners();
            };
            const removeSkipListeners = () => {
                window.removeEventListener('wheel', skip);
                window.removeEventListener('touchmove', skip);
                window.removeEventListener('keydown', skip);
            };
            window.addEventListener('wheel', skip, { passive: true });
            window.addEventListener('touchmove', skip, { passive: true });
            window.addEventListener('keydown', skip);
            tl.eventCallback('onComplete', () => {
                finish();
                removeSkipListeners();
            });

            return () => {
                removeSkipListeners();
                tl.kill();
                motion.offsetY = 0;
                motion.squash = 1;
                finish();
            };
        },
        { dependencies: [enabled, ready, path, motion] },
    );
}
