import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

export type OrbPointer = { x: number; y: number; active: boolean };

/**
 * The mouse position in viewport px, for the orb's hover reaction. The canvas
 * ignores pointer events (so it never blocks the page), so this listens on
 * the window instead. Inactive on touch screens and when disabled.
 */
export function useOrbPointer(enabled: boolean): RefObject<OrbPointer> {
    const pointer = useRef<OrbPointer>({ x: 0, y: 0, active: false });

    useEffect(() => {
        const state = pointer.current;

        if (
            !enabled ||
            !window.matchMedia('(hover: hover) and (pointer: fine)').matches
        ) {
            state.active = false;

            return;
        }

        const onMove = (event: PointerEvent) => {
            state.x = event.clientX;
            state.y = event.clientY;
            state.active = true;
        };
        const onLeave = () => {
            state.active = false;
        };

        window.addEventListener('pointermove', onMove, { passive: true });
        document.documentElement.addEventListener('pointerleave', onLeave);

        return () => {
            window.removeEventListener('pointermove', onMove);
            document.documentElement.removeEventListener(
                'pointerleave',
                onLeave,
            );
            state.active = false;
        };
    }, [enabled]);

    return pointer;
}
