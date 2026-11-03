import type { ScrollTrigger } from 'gsap/ScrollTrigger';

/** How the orb travels through a section. */
export type OrbMode = 'vertical' | 'horizontal';

/** Which gutter beside the section content the orb sits in. */
export type OrbSide = 'left' | 'right';

/** How the orb reaches and leaves a stop inside text (see `data-orb-via`). */
export type OrbVia = 'none' | 'down' | 'right';

/** A vertical line the orb rolls down (see `data-orb-track`). Document px. */
export type OrbTrack = {
    top: DocPoint;
    bottom: DocPoint;
    /** Items lit up once the orb passes their top. */
    entries: { element: HTMLElement; top: number }[];
};

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

/** A card the orb presents in a pinned horizontal section. */
export type OrbPinItem = {
    element: HTMLElement;
    /** Centre x in viewport px, with the row at rest (untranslated). */
    center: number;
    width: number;
};

/**
 * A pinned horizontal section, created by the orb path for stops with
 * `data-orb-mode="horizontal"` (desktop only). While pinned, the row slides
 * left and the orb rolls along the lane's track from one end to the other.
 */
export type OrbPin = {
    trigger: ScrollTrigger;
    /** Scroll positions where the pin starts and ends. */
    start: number;
    end: number;
    row: HTMLElement | null;
    items: OrbPinItem[];
    /** How far the row slides left over the pin, in px. */
    overflow: number;
};

/**
 * The track along the bottom of a `data-orb-lane`. The orb sits on it and
 * rolls from `start` to `end` (x of its centre, document px) as the section
 * scrolls horizontally: with the pin on desktop, by swiping the row on small screens.
 */
export type OrbLane = {
    start: number;
    end: number;
    /** Centre y of the orb sitting on the line, document px (before the pin, for pinned sections). */
    y: number;
    radius: number;
    /** The natively scrolling row, when not pinned. */
    viewport: HTMLElement | null;
    items: HTMLElement[];
};

/**
 * One measured stop on the orb's path, read from an element with
 * `data-orb-stop`. Positions are in document px, so the stop stays valid
 * while scrolling. Convert to world space per frame with `docToWorld`.
 */
export type OrbStop = {
    id: string;
    index: number;
    mode: OrbMode;
    side: OrbSide;
    element: HTMLElement;
    /**
     * The element's content box: what the orb must not cover. For a pinned
     * stop this is where it sits before the pin; after the pin it is lower
     * by `pin.end - pin.start`.
     */
    bounds: DocRect;
    /**
     * Where the orb rests for this stop: beside the text marked
     * `data-orb-beside` if there is room, else centred in the gutter, or above
     * the content when compact. For a pinned stop, in the gutter beside the lane.
     */
    anchor: DocPoint;
    /** The orb's radius at this stop, in px: the layout radius, or the size of the dot it replaces. */
    radius: number;
    /** Resting in a dot or slot (`data-orb-dot`, `data-orb-slot`): placed precisely, so it doesn't drift. */
    letter: boolean;
    /** How it reaches and leaves this stop (`data-orb-via`). */
    via: OrbVia;
    /** Width of the page margin right of the content, in px. */
    margin: number;
    /** The line it rolls down, for `data-orb-track` stops. */
    track: OrbTrack | null;
    /** The horizontal track it rolls along, for horizontal stops with a `data-orb-lane`. */
    lane: OrbLane | null;
    pin: OrbPin | null;
};

export type OrbLayout = {
    stops: OrbStop[];
    /** Orb radius in CSS px, sized to fit the narrowest gutter. Letter stops use their own (see OrbStop.radius). */
    radius: number;
    /**
     * True when gutters are too narrow for the orb (mobile). Stops then sit
     * above their content, and the orb travels small along the edge margin.
     */
    compact: boolean;
    /** The narrowest gutter beside the content, in px. */
    gutter: number;
    viewport: { width: number; height: number };
    documentHeight: number;
    maxScroll: number;
};

/** A point on the route, with the orb's radius there (it shrinks to travel along narrow margins). */
export type RoutePoint = { x: number; y: number; r: number };

/** One straight piece of the rolling path, used to derive the orb's rotation. */
export type RouteSegment = {
    /** Total distance rolled at the start of this segment, in px. */
    d0: number;
    length: number;
    /** Unit direction of travel, in px (y down). */
    dx: number;
    dy: number;
    /** Average orb radius along the segment, in px. */
    r: number;
    /** How much slower than true rolling the orb turns here (1 = distance / radius). */
    gear: number;
};

/** Where the orb is for a given scroll position. */
export type OrbSample = {
    /** Document px. */
    x: number;
    y: number;
    /** Radius in px. */
    r: number;
    /** Total distance rolled so far, in px. Drives rotation. */
    distance: number;
    /** Index into `OrbRoute.segments`, or -1 before the orb has moved. */
    segment: number;
};

export type OrbRoute = {
    segments: RouteSegment[];
    sample: (scroll: number, out?: OrbSample) => OrbSample;
};

export type OrbPathOptions = {
    /** Pin horizontal sections. Off for reduced motion. Pinning is also skipped when compact. */
    pinning: boolean;
    /** Keep the orb at the first stop instead of following the scroll (reduced motion). */
    still: boolean;
};

export type OrbPathStore = {
    get: () => OrbLayout;
    route: () => OrbRoute;
    /**
     * The scroll position the orb follows: the real scroll, eased with a
     * short catch-up lag. Sample the route with this, not window.scrollY.
     */
    scroll: () => number;
    /**
     * How far (px) swiping a lane's row has rolled the orb along that lane's
     * track, for an orb at `point`. Only on small screens (pinned lanes are
     * driven by the scroll), and only while the orb rests on the lane.
     */
    laneShift: (point: { x: number; y: number; r: number }) => number;
    subscribe: (listener: () => void) => () => void;
    /** Re-measure on the next frame. Called automatically on resize, refresh and DOM changes. */
    refresh: () => void;
    destroy: () => void;
};
