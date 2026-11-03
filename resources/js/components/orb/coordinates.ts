import type { Vector3 } from 'three';

type Size = { width: number; height: number };

/**
 * Converts a point in document px to world units on the z = 0 plane.
 * `size` is the canvas size in CSS px and `viewportWidth` the width of the
 * visible z = 0 plane in world units (R3F's `state.viewport.width`).
 * The canvas is fixed to the window, so the current scroll offset is subtracted.
 */
export function docToWorld(
    x: number,
    y: number,
    scrollY: number,
    size: Size,
    viewportWidth: number,
    target: Vector3,
): Vector3 {
    const unitsPerPx = viewportWidth / size.width;

    return target.set(
        (x - size.width / 2) * unitsPerPx,
        (size.height / 2 - (y - scrollY)) * unitsPerPx,
        0,
    );
}

/** Converts a length in CSS px to world units. */
export function pxToWorld(
    px: number,
    size: Size,
    viewportWidth: number,
): number {
    return px * (viewportWidth / size.width);
}
