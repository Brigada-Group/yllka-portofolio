import { lazy, Suspense, useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-media-query';
import { useReducedMotion } from '@/lib/motion';
import { useTheme } from '@/lib/theme';
import { shouldPlayIntro } from './intro';
import { createOrbMotion } from './motion';
import OrbErrorBoundary from './orb-error-boundary';
import OrbMarkers from './orb-markers';
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
 * Resolves once web fonts have loaded (or after `timeout` ms), so text
 * positions the orb depends on have settled.
 */
function useFontsReady(timeout = 2000): boolean {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const done = () => !cancelled && setReady(true);
        const timer = setTimeout(done, timeout);
        void document.fonts?.ready.then(done);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [timeout]);

    return ready;
}

/**
 * Drop this into a page that has `data-orb-stop` sections. Renders nothing
 * on the server and until the browser is idle, then loads the canvas chunk.
 */
export default function OrbStage() {
    // Decided once per mount. Never true on the server.
    const [introEnabled] = useState(shouldPlayIntro);
    const [motion] = useState(() => createOrbMotion(introEnabled));
    const [ready, setReady] = useState(false);
    const reducedMotion = useReducedMotion();
    // Reduced motion: no pinning, and the orb stays in the hero.
    const path = useOrbPath({ pinning: !reducedMotion, still: reducedMotion });
    // The hero text is hidden while the intro is pending, so load straight away.
    const idle = useIdle(introEnabled);
    const mobile = useIsMobile();
    const theme = useTheme();
    // `?orbDebug=1` (or `?orb-debug`): route trace, stop rings and timing markers.
    const [debug] = useState(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        const params = new URLSearchParams(window.location.search);

        return params.get('orbDebug') === '1' || params.has('orb-debug');
    });

    const fontsReady = useFontsReady();

    // Drop once the scene is warmed up and the headline's letter gap has its final position.
    useOrbIntro({
        path,
        motion,
        ready: ready && fontsReady,
        enabled: introEnabled,
    });

    // `?orb-debug`: expose the path for inspection in the console.
    useEffect(() => {
        if (!debug || !path) {
            return;
        }

        Object.assign(window, { __orb: path, __orbMotion: motion });

        return () => {
            Reflect.deleteProperty(window, '__orb');
            Reflect.deleteProperty(window, '__orbMotion');
        };
    }, [debug, path, motion]);

    if (!path || !idle) {
        return null;
    }

    return (
        <>
            {debug && <OrbMarkers path={path} />}
            <OrbErrorBoundary>
                <Suspense fallback={null}>
                    <OrbCanvas
                        path={path}
                        motion={motion}
                        onReady={() => setReady(true)}
                        mobile={mobile}
                        reducedMotion={reducedMotion}
                        debug={debug}
                        theme={theme}
                    />
                </Suspense>
            </OrbErrorBoundary>
        </>
    );
}
