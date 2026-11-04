/**
 * Shared state between the orb (drawn in the canvas) and the hero's DOM
 * layer: its glow, the handle you drag it by, and the hint. Plain mutable
 * numbers, read and written every frame, so nothing here renders React.
 *
 * Kept free of three.js, so the hero can import it without loading the canvas.
 */
export type OrbPlay = {
    /** Where the hero holds the orb, centre in document px. */
    x: number;
    y: number;
    /** 1: the orb is at (x, y). 0: back on its route. In between while it returns. */
    blend: number;
    /** Extra height (px, up) for the arc it returns along. */
    lift: number;
};

export const orbHero = {
    /** Written by the orb: where it is drawn (centre, document px) and its radius. */
    x: 0,
    y: 0,
    r: 0,
    drawn: false,
    /** Written by the orb: parked on the hero's ı, intro over, page at the top. */
    resting: false,
    /** Written by the hero while the orb is dragged, thrown or returning. */
    play: null as OrbPlay | null,
    /** Written by the hero: a hop on hover, as a vertical offset (px, up is negative) and squash. */
    hop: { y: 0, squash: 1 },
    /** Called right after the orb is placed each frame, so DOM that follows it never lags a frame. */
    listeners: new Set<() => void>(),
};
