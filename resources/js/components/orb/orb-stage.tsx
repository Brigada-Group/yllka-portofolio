import { lazy, Suspense, useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-media-query';
import { useOrbPath } from './use-orb-path';

const OrbCanvas = lazy(() => import('./orb-canvas'));

/** Resolves once the browser is idle, so the canvas never competes with first paint. */
function useIdle(): boolean {
    const [idle, setIdle] = useState(false);

    useEffect(() => {
        if ('requestIdleCallback' in window) {
            const id = window.requestIdleCallback(() => setIdle(true), {
                timeout: 1500,
            });

            return () => window.cancelIdleCallback(id);
        }

        const id = setTimeout(() => setIdle(true), 200);

        return () => clearTimeout(id);
    }, []);

    return idle;
}

/**
 * Drop this into a page that has `data-orb-stop` sections. Renders nothing
 * on the server and until the browser is idle, then loads the canvas chunk.
 */
export default function OrbStage() {
    const path = useOrbPath();
    const idle = useIdle();
    const mobile = useIsMobile();
    const [debug] = useState(
        () =>
            typeof window !== 'undefined' &&
            new URLSearchParams(window.location.search).has('orb-debug'),
    );

    if (!path || !idle) {
        return null;
    }

    return (
        <Suspense fallback={null}>
            <OrbCanvas path={path} mobile={mobile} debug={debug} />
        </Suspense>
    );
}
