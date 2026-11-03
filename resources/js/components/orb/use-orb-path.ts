import { useLayoutEffect, useState, useSyncExternalStore } from 'react';
import type { RefObject } from 'react';
import { createOrbPath } from './orb-path';
import type { OrbLayout, OrbPathOptions, OrbPathStore } from './types';

/**
 * Creates the orb path for the stops inside `root` (the whole body by
 * default) and tears it down on unmount. Sections opt in with data attributes:
 *
 *   <div data-orb-stop="projects" data-orb-mode="horizontal" data-orb-side="left">
 *
 * Add, remove or reorder such elements and the path follows. No orb code changes.
 *
 * A layout effect, so pins are reverted before React removes the pinned
 * sections. ScrollTrigger wraps them in spacer elements React doesn't know about.
 */
export function useOrbPath(
    { pinning, still }: OrbPathOptions,
    root?: RefObject<HTMLElement | null>,
): OrbPathStore | null {
    const [store, setStore] = useState<OrbPathStore | null>(null);

    useLayoutEffect(() => {
        const instance = createOrbPath(root?.current ?? document.body, {
            pinning,
            still,
        });
        setStore(instance);

        return () => {
            instance.destroy();
            setStore(null);
        };
    }, [root, pinning, still]);

    return store;
}

const EMPTY_SUBSCRIBE = () => () => {};

/**
 * Re-renders when the layout is re-measured. For React UI only. Inside the
 * render loop, read `store.get()` each frame instead.
 */
export function useOrbLayout(store: OrbPathStore | null): OrbLayout | null {
    return useSyncExternalStore(
        store?.subscribe ?? EMPTY_SUBSCRIBE,
        () => store?.get() ?? null,
        () => null,
    );
}
