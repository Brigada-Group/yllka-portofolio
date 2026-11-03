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
    /** Impact ripple progress from 0 to 1. Rings are hidden outside (0, 1). */
    ripple: number;
};

export function createOrbMotion(visible: boolean): OrbMotion {
    return { visible, offsetY: 0, squash: 1, ripple: 1 };
}
