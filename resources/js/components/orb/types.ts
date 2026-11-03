/** How the orb travels through a section. */
export type OrbMode = 'vertical' | 'horizontal';

/** Which gutter beside the section content the orb sits in. */
export type OrbSide = 'left' | 'right';

/** A point in document coordinates (CSS px from the top-left of the page). */
export type DocPoint = { x: number; y: number };

/** A box in document coordinates. */
export type DocRect = {
    top: number;
    bottom: number;
    left: number;
    right: number;
    width: number;
    height: number;
};

/**
 * One measured stop on the orb's path, read from an element with
 * `data-orb-stop`. Everything is in document px, so the stop stays valid
 * while scrolling. Convert to world space per frame with `docToWorld`.
 */
export type OrbStop = {
    id: string;
    index: number;
    mode: OrbMode;
    side: OrbSide;
    element: HTMLElement;
    /** The element's box: the content the orb must not cover. */
    bounds: DocRect;
    /** Where the orb rests for this stop: centred in the gutter, or above the content when compact. */
    anchor: DocPoint;
};

export type OrbLayout = {
    stops: OrbStop[];
    /** Orb radius in CSS px, sized to fit the narrowest gutter. */
    radius: number;
    /** True when gutters are too narrow for the orb (mobile). Stops then sit above their content. */
    compact: boolean;
    viewport: { width: number; height: number };
    documentHeight: number;
};

export type OrbPathStore = {
    get: () => OrbLayout;
    subscribe: (listener: () => void) => () => void;
    /** Re-measure on the next frame. Called automatically on resize and DOM changes. */
    refresh: () => void;
    destroy: () => void;
};
