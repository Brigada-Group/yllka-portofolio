import { useEffect, useState, useSyncExternalStore } from 'react';
import type { RefObject } from 'react';
import { createOrbPath } from './orb-path';
import type { OrbLayout, OrbPathStore } from './types';

/**
 * Creates the orb path store for the stops inside `root` (the whole body by
 * default) and tears it down on unmount. Sections opt in with data attributes:
 *
 *   <div data-orb-stop="projects" data-orb-mode="horizontal" data-orb-side="left">
 *
 * Add, remove or reorder such elements and the path follows. No orb code changes.
 */
export function useOrbPath(
    root?: RefObject<HTMLElement | null>,
): OrbPathStore | null {
    const [store, setStore] = useState<OrbPathStore | null>(null);

    useEffect(() => {
        const instance = createOrbPath(root?.current ?? document.body);
        setStore(instance);

        return () => {
            instance.destroy();
            setStore(null);
        };
    }, [root]);

    return store;
}

const EMPTY_SUBSCRIBE = () => () => {};

/**
 * Re-renders when the layout is re-measured. For React UI only. Inside the
 * render loop read `store.get()` each frame instead.
 */
export function useOrbLayout(store: OrbPathStore | null): OrbLayout | null {
    return useSyncExternalStore(
        store?.subscribe ?? EMPTY_SUBSCRIBE,
        () => store?.get() ?? null,
        () => null,
    );
}
