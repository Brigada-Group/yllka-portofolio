import type { ScrollTrigger } from 'gsap/ScrollTrigger';

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
/**
 * A point in the scroll (from `data-orb-arrive` / `data-orb-depart`): where
 * on the page (`elementY`, document px) meets where in the viewport
 * (`viewportY`, px from its top), and the scroll position at which they do.
 */
export type OrbTiming = { scroll: number; elementY: number; viewportY: number };

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
    /**
     * The x extent (document px) of the surface the orb sits on here: the
     * top of a letter, a heading's baseline up to its full stop, a track.
     * When it leaves, it rolls off the right end and falls.
     */
    ledge: { left: number; right: number };
    /** The stop's section, document px. Its edges are where the orb crosses between sections. */
    section: { top: number; bottom: number };
    /**
     * When the orb must have arrived (`data-orb-arrive`, default "top 60%")
     * and when it may leave (`data-orb-depart`, default "bottom 80%"),
     * measured against the section, or the stop itself with
     * `data-orb-trigger="self"`. In between, it is parked.
     */
    arrive: OrbTiming;
    depart: OrbTiming;
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
/**
 * Ties the orb's height to a pinned section's track. The track's place on
 * screen depends on the real scroll (it is frozen while pinned), while the
 * orb follows a lagged scroll; on and near the track, the orb's height must
 * follow the real one or it bobs up and down as the lag catches up.
 */
export type OrbPinFrame = {
    /** The track's y in the frame of the current leg, in document px. */
    y: number;
    /** The pin's start scroll and length. */
    start: number;
    span: number;
    /** How far the section had moved when this leg was measured: 0 before the pin, the span after it. */
    frame: number;
    /** On the track during the pin (fully attached), rather than rolling onto or off it. */
    pinned: boolean;
};

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
    /** Set on and around a pinned track (see OrbPinFrame). */
    frame: OrbPinFrame | null;
    /** How far through its current leg the orb is, 0 to 1 (by scroll). */
    progress: number;
    /** Vertical squash from landing (1 = round; below 1 flattened, at touchdown). */
    squash: number;
};

/** Debug drawing of the computed path (`?orbDebug=1`): ledges, roll-off points and landings. Document px. */
export type RouteMark =
    | { kind: 'ledge'; x: number; x1: number; y: number }
    | { kind: 'rolloff' | 'landing'; x: number; y: number };

export type OrbRoute = {
    segments: RouteSegment[];
    marks: RouteMark[];
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
