import { lazy, Suspense, useEffect, useState } from 'react';
import { useIsMobile, usePrefersReducedMotion } from '@/hooks/use-media-query';
import { shouldPlayIntro } from './intro';
import { createOrbMotion } from './motion';
import OrbErrorBoundary from './orb-error-boundary';
import { useOrbIntro } from './use-orb-intro';
import { useOrbPath } from './use-orb-path';

const OrbCanvas = lazy(() => import('./orb-canvas'));

/**
 * Resolves once the browser is idle, so the canvas never competes with
 * first paint. Resolves immediately when `skip` is set.
 */
function useIdle(skip: boolean): boolean {
    const [idle, setIdle] = useState(skip);

    useEffect(() => {
        if (idle) {
            return;
        }

        if ('requestIdleCallback' in window) {
            const id = window.requestIdleCallback(() => setIdle(true), {
                timeout: 1500,
            });

            return () => window.cancelIdleCallback(id);
        }

        const id = setTimeout(() => setIdle(true), 200);

        return () => clearTimeout(id);
    }, [idle]);

    return idle;
}

/**
 * Drop this into a page that has `data-orb-stop` sections. Renders nothing
 * on the server and until the browser is idle, then loads the canvas chunk.
 * Mark the hero text with `data-orb-reveal` for the intro ripple to reveal it.
 */
export default function OrbStage() {
    // Decided once per mount. Never true on the server.
    const [introEnabled] = useState(shouldPlayIntro);
    const [motion] = useState(() => createOrbMotion(!introEnabled));
    const [ready, setReady] = useState(false);
    const reducedMotion = usePrefersReducedMotion();
    // Reduced motion: no pinning, and the orb stays in the hero.
    const path = useOrbPath({ pinning: !reducedMotion, still: reducedMotion });
    // The hero text is hidden while the intro is pending, so load straight away.
    const idle = useIdle(introEnabled);
    const mobile = useIsMobile();
    const [debug] = useState(
        () =>
            typeof window !== 'undefined' &&
            new URLSearchParams(window.location.search).has('orb-debug'),
    );

    useOrbIntro({ path, motion, ready, enabled: introEnabled });

    // `?orb-debug`: expose the path for inspection in the console.
    useEffect(() => {
        if (!debug || !path) {
            return;
        }

        Object.assign(window, { __orb: path });

        return () => {
            Reflect.deleteProperty(window, '__orb');
        };
    }, [debug, path]);

    if (!path || !idle) {
        return null;
    }

    return (
        <OrbErrorBoundary>
            <Suspense fallback={null}>
                <OrbCanvas
                    path={path}
                    motion={motion}
                    onReady={() => setReady(true)}
                    mobile={mobile}
                    debug={debug}
                />
            </Suspense>
        </OrbErrorBoundary>
    );
}
