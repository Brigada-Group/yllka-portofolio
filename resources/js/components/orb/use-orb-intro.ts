import { useLayoutEffect, useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { markIntroPlayed } from './intro';
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
 * squashes, bounces twice and settles. The page content stays put: only
 * the orb moves. Any scroll input skips straight to the end state.
 *
 * Everything is keyframed on one timeline, so skipping is just `progress(1)`.
 */
export function useOrbIntro({ path, motion, ready, enabled }: OrbIntroOptions) {
    const skipped = useRef(false);

    // If the visitor scrolls before the canvas is ready, skip the drop.
    useLayoutEffect(() => {
        if (!enabled) {
            return;
        }

        markIntroPlayed();

        const skipEarly = () => {
            skipped.current = true;
            motion.offsetY = 0;
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

                return;
            }

            // Start fully above the viewport, so the orb drops in from off screen.
            const fall = hero.anchor.y + hero.radius * 3;
            const tl = gsap.timeline();

            // Fall: accelerate under "gravity" and stretch with speed.
            tl.fromTo(
                motion,
                { offsetY: -fall, squash: 1 },
                { offsetY: 0, squash: 1.12, duration: 0.75, ease: 'power2.in' },
            );

            // First impact: squash, then rebound. Each bounce is placed at a
            // fixed time after impact, so nothing added to the timeline can
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
            tl.eventCallback('onComplete', removeSkipListeners);

            return () => {
                removeSkipListeners();
                tl.kill();
                motion.offsetY = 0;
                motion.squash = 1;
            };
        },
        { dependencies: [enabled, ready, path, motion] },
    );
}
