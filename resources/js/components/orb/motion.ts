/**
 * Mutable animation state shared between GSAP (writes) and the render loop
 * (reads every frame). Plain numbers, so tweening it never triggers React renders.
 */
export type OrbMotion = {
    visible: boolean;
    /** Vertical offset from the current resting point, in CSS px. Negative is up. */
    offsetY: number;
    /** Vertical scale. Below 1 squashes, above 1 stretches. Volume is preserved. */
    squash: number;
};

/** Far above the page: where the orb waits, already rendering, until the intro drops it. */
export const PARKED_OFFSET = -100_000;

/**
 * Initial motion state. With an intro pending, the orb is parked off screen
 * rather than hidden, so its shaders compile and textures upload before the
 * drop starts instead of stalling the first frames of it.
 */
export function createOrbMotion(introPending: boolean): OrbMotion {
    return {
        visible: true,
        offsetY: introPending ? PARKED_OFFSET : 0,
        squash: 1,
    };
}
