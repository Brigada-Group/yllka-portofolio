import type {
    OrbLayout,
    OrbVia,
    OrbRoute,
    OrbSample,
    OrbStop,
    RoutePoint,
    RouteSegment,
} from './types';

/** Where the orb arrives at a stop: this far down the viewport (0 = top, 1 = bottom). */
const ARRIVAL_FOCUS = 0.4;
/** Corner rounding where the path turns, in px. */
const CORNER_RADIUS = 96;
const COMPACT_CORNER_RADIUS = 24;
const CORNER_STEPS = 8;
/** How far the orb overshoots a stop before settling back onto it, in px. */
const ARRIVAL_OVERSHOOT = 10;

/** One piece of the route, travelled while the scroll moves from s0 to s1. */
type Leg = {
    s0: number;
    s1: number;
    /** Pinned legs are in screen space: their y follows the scroll. */
    pinned: boolean;
    points: RoutePoint[];
    /** Cumulative distance at each point. */
    cum: number[];
    /**
     * Keyframes: the point indices the orb eases between, and the share of
     * the leg's scroll at which it reaches each. The orb slows down at each key.
     */
    keys: { index: number; t: number }[];
    /**
     * Spin legs hold the orb still at their first point while it rolls this
     * far in place, keeping pace with a sliding row. 0 for travel legs.
     */
    spin: number;
    /** Overshoot strength for arriving at the end of the leg (see `overshoot`). 0 for none. */
    settle: number;
    /** Move at a constant rate (rolling down a track), instead of easing in and out. */
    linear: boolean;
    /** Distance rolled before this leg, and index of its first segment. */
    d0: number;
    segment0: number;
};

/** The point where the orb's current leg begins. */
type Cursor = {
    point: RoutePoint;
    scroll: number;
    /** Bottom of the content it is leaving, in document px. */
    bottom: number;
    /** How it leaves (see OrbVia). */
    via: OrbVia;
    /** Width of the page margin right of the content it is leaving. */
    margin: number;
};

/** Where a leg is heading. `lane`: along a pinned section's lane, from the side it arrives on. */
type Target = {
    point: RoutePoint;
    /** Top of the content it is heading for. */
    top: number;
    via: OrbVia | 'lane';
    margin: number;
};

/** How far below the content a letter stop's exit runs, in px. */
const EXIT_BELOW = 24;

const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

const smoothstep = (t: number) => t * t * (3 - 2 * t);

/**
 * Ease in and out, overshooting the end by a little before settling back:
 * smoothstep plus c·t³(1−t)². Still at both ends, never moves backwards at
 * the start, and overshoots for c > 3.
 */
const overshoot = (t: number, c: number) =>
    smoothstep(t) + c * t ** 3 * (1 - t) ** 2;

/** The c that makes `overshoot` pass the end by `fraction` of the leg. */
function overshootFor(fraction: number): number {
    const peak = (c: number) => {
        let max = 0;

        for (let i = 0; i <= 100; i++) {
            max = Math.max(max, overshoot(0.75 + i * 0.0025, c));
        }

        return max - 1;
    };
    let [lo, hi] = [3, 8];

    for (let i = 0; i < 20; i++) {
        const mid = (lo + hi) / 2;

        if (peak(mid) < fraction) {
            lo = mid;
        } else {
            hi = mid;
        }
    }

    return lo;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Replaces each interior corner with a short curve, so the orb turns
 * smoothly instead of snapping 90°.
 */
function roundCorners(points: RoutePoint[], radius: number): RoutePoint[] {
    if (points.length < 3) {
        return points;
    }

    const result: RoutePoint[] = [points[0]];

    for (let i = 1; i < points.length - 1; i++) {
        const [prev, corner, next] = [points[i - 1], points[i], points[i + 1]];
        const inLength = Math.hypot(corner.x - prev.x, corner.y - prev.y);
        const outLength = Math.hypot(next.x - corner.x, next.y - corner.y);
        const cut = Math.min(radius, inLength / 2, outLength / 2);

        if (cut < 1) {
            result.push(corner);
            continue;
        }

        const from = towards(corner, prev, cut / inLength);
        const to = towards(corner, next, cut / outLength);

        // Quadratic Bézier from `from` to `to`, with the corner as control point.
        for (let step = 0; step <= CORNER_STEPS; step++) {
            const t = step / CORNER_STEPS;
            const a = towards(from, corner, t);
            const b = towards(corner, to, t);
            result.push(towards(a, b, t));
        }
    }

    result.push(points[points.length - 1]);

    return result;
}

/** The point a share `t` of the way from `a` to `b`. */
function towards(a: RoutePoint, b: RoutePoint, t: number): RoutePoint {
    return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), r: lerp(a.r, b.r, t) };
}

function cumulative(points: RoutePoint[]): number[] {
    const cum = [0];

    for (let i = 1; i < points.length; i++) {
        cum.push(
            cum[i - 1] +
                Math.hypot(
                    points[i].x - points[i - 1].x,
                    points[i].y - points[i - 1].y,
                ),
        );
    }

    return cum;
}

/**
 * The waypoints from one stop to the next, with rounded corners. The orb
 * never crosses text: it changes sides in the gap between sections, uses
 * the page margin to reach or leave a stop inside a line of text, and on
 * small screens (compact) shrinks into the margin to travel.
 */
function travel(from: Cursor, to: Target, layout: OrbLayout): RoutePoint[] {
    const { width } = layout.viewport;
    const marginX = (margin: number) => width - margin / 2;
    const marginRadius = (margin: number, r: number) =>
        Math.max(2, Math.min(r, margin / 2 - 2));
    const waypoints: RoutePoint[] = [from.point];
    let at = from.point;
    const go = (point: RoutePoint) => {
        if (Math.hypot(point.x - at.x, point.y - at.y) >= 1) {
            waypoints.push(point);
            at = point;
        }
    };

    // Leave the stop.
    if (from.via === 'right') {
        go({
            x: marginX(from.margin),
            y: at.y,
            r: marginRadius(from.margin, at.r),
        });
    } else if (from.via === 'down') {
        go({ ...at, y: from.bottom + EXIT_BELOW });
    }

    const gapY = Math.max(at.y, (from.bottom + to.top) / 2);

    if (to.via === 'lane') {
        // Straight down to the lane, then along it.
        go({ ...at, y: to.point.y });
    } else if (to.via === 'right') {
        // Over to the right margin in the gap, down it, then in along the line.
        const x = marginX(to.margin);
        const r = marginRadius(to.margin, at.r);

        if (Math.abs(at.x - x) >= 1) {
            go({ ...at, y: gapY });
            go({ x, y: gapY, r });
        }

        go({ x, y: to.point.y, r });
    } else if (layout.compact) {
        // No gutters: shrink into the margin, travel down it, grow again at the stop.
        const edge = at.x < width / 2 ? from.margin / 2 : marginX(from.margin);
        const r = marginRadius(from.margin, at.r);
        go({ x: edge, y: at.y, r });
        go({ x: edge, y: to.point.y, r });
    } else if (Math.abs(at.x - to.point.x) >= 1) {
        // Change sides in the gap between the two sections.
        go({ ...at, y: gapY });
        go({ ...to.point, y: gapY });
    }

    go(to.point);

    return roundCorners(
        waypoints,
        layout.compact ? COMPACT_CORNER_RADIUS : CORNER_RADIUS,
    );
}

/**
 * Pinned horizontal section: the orb waits in its gutter beside the row and
 * spins as the row slides past, like a wheel on a conveyor. It rolls as far
 * as the row slides. Its point is in screen space, so it stays put while pinned.
 */
function spinLeg(stop: OrbStop, radius: number) {
    const pin = stop.pin!;

    return {
        points: [{ x: pin.entryX, y: pin.screenTop + pin.laneY, r: radius }],
        // Spin at least half a turn, even when the row barely moves.
        spin: Math.max(pin.overflow, Math.PI * radius),
    };
}

/** How far the row in a pinned section has slid at a scroll position. */
export function pinnedRowOffset(stop: OrbStop, scroll: number): number {
    return -pinProgress(stop, scroll) * stop.pin!.overflow;
}

/** How far through a pinned section the scroll is, from 0 to 1. */
export function pinProgress(stop: OrbStop, scroll: number): number {
    const pin = stop.pin!;

    return clamp((scroll - pin.start) / (pin.end - pin.start || 1), 0, 1);
}

/**
 * Builds the orb's route through every stop. Scroll positions map to points
 * on the route, so the orb's position depends only on the scroll.
 */
export function buildOrbRoute(layout: OrbLayout, still: boolean): OrbRoute {
    const { stops, radius, viewport, maxScroll } = layout;
    const first = stops[0];

    if (!first) {
        return staticRoute({ x: -9999, y: -9999, r: radius });
    }

    const rest: RoutePoint = { ...first.anchor, r: first.radius };

    if (still) {
        return staticRoute(rest);
    }

    const arrival = (y: number) =>
        clamp(y - viewport.height * ARRIVAL_FOCUS, 0, maxScroll);
    const legs: Omit<Leg, 'd0' | 'segment0'>[] = [];
    let cursor: Cursor = {
        point: rest,
        scroll: arrival(first.anchor.y),
        bottom: first.bounds.bottom,
        via: first.via,
        margin: first.margin,
    };

    // Each leg starts after the previous one ends, even if the layout is too short to give it room.
    const after = (scroll: number) => Math.max(scroll, cursor.scroll + 1);

    /** `settle`: overshoot the stop a little and come back. Off for stops inside text, which must land exactly. */
    const pushTravel = (points: RoutePoint[], s1: number, settle: boolean) => {
        legs.push({
            s0: cursor.scroll,
            s1,
            pinned: false,
            spin: 0,
            settle: settle ? settleFor(points) : 0,
            linear: false,
            points,
            cum: cumulative(points),
            keys: [
                { index: 0, t: 0 },
                { index: points.length - 1, t: 1 },
            ],
        });
    };

    for (const stop of stops.slice(1)) {
        const point: RoutePoint = { ...stop.anchor, r: stop.radius };
        const target: Target = {
            point,
            top: stop.bounds.top,
            via: stop.pin ? 'lane' : stop.via,
            margin: stop.margin,
        };

        if (stop.pin) {
            const pin = stop.pin;
            pushTravel(travel(cursor, target, layout), after(pin.start), true);

            const spin = spinLeg(stop, stop.radius);
            const s0 = after(pin.start);
            legs.push({
                s0,
                s1: Math.max(pin.end, s0 + 1),
                pinned: true,
                ...spin,
                settle: 0,
                linear: true,
                cum: [0],
                keys: [{ index: 0, t: 0 }],
            });

            // After the pin, the section has moved down by the pin's length.
            const shift = pin.end - pin.start;
            cursor = {
                point: { ...point, y: point.y + shift },
                scroll: Math.max(pin.end, s0 + 1),
                bottom: stop.bounds.bottom + shift,
                via: 'none',
                margin: stop.margin,
            };
            continue;
        }

        const s1 = after(arrival(point.y));
        pushTravel(travel(cursor, target, layout), s1, !stop.letter);
        cursor = {
            point,
            scroll: s1,
            bottom: stop.bounds.bottom,
            via: stop.via,
            margin: stop.margin,
        };

        if (stop.track) {
            // Roll down the line at the pace of the scroll, staying level on screen.
            const bottom: RoutePoint = { ...stop.track.bottom, r: stop.radius };
            const points = [point, bottom];
            const end = after(arrival(bottom.y));
            legs.push({
                s0: cursor.scroll,
                s1: end,
                pinned: false,
                spin: 0,
                settle: 0,
                linear: true,
                points,
                cum: cumulative(points),
                keys: [
                    { index: 0, t: 0 },
                    { index: 1, t: 1 },
                ],
            });
            cursor = { ...cursor, point: bottom, scroll: end, via: 'none' };
        }
    }

    return createRoute(rest, legs);
}

/** Overshoot strength for a leg, so it passes its stop by ARRIVAL_OVERSHOOT px whatever its length. */
function settleFor(points: RoutePoint[]): number {
    const length = cumulative(points).at(-1) ?? 0;

    return length > ARRIVAL_OVERSHOOT * 4
        ? overshootFor(ARRIVAL_OVERSHOOT / length)
        : 0;
}

function staticRoute(point: RoutePoint): OrbRoute {
    return {
        segments: [],
        sample: (_scroll, out = emptySample()) =>
            Object.assign(out, {
                x: point.x,
                y: point.y,
                r: point.r,
                distance: 0,
                segment: -1,
            }),
    };
}

const emptySample = (): OrbSample => ({
    x: 0,
    y: 0,
    r: 0,
    distance: 0,
    segment: -1,
});

function createRoute(
    rest: RoutePoint,
    rawLegs: Omit<Leg, 'd0' | 'segment0'>[],
): OrbRoute {
    const segments: RouteSegment[] = [];
    let distance = 0;

    const legs: Leg[] = rawLegs.map((leg) => {
        const built = { ...leg, d0: distance, segment0: segments.length };

        for (let i = 1; i < leg.points.length; i++) {
            const [a, b] = [leg.points[i - 1], leg.points[i]];
            const length = leg.cum[i] - leg.cum[i - 1];
            segments.push({
                d0: distance,
                length,
                dx: length > 0 ? (b.x - a.x) / length : 0,
                dy: length > 0 ? (b.y - a.y) / length : 0,
                r: (a.r + b.r) / 2,
            });
            distance += length;
        }

        if (leg.spin > 0) {
            // Rolling in place, as if travelling right over the row sliding left.
            segments.push({
                d0: distance,
                length: leg.spin,
                dx: 1,
                dy: 0,
                r: leg.points[0].r,
            });
            distance += leg.spin;
        }

        return built;
    });

    const placeAt = (
        leg: Leg,
        along: number,
        scroll: number,
        out: OrbSample,
    ) => {
        // Binary search for the segment containing `along`.
        let lo = 0;
        let hi = leg.points.length - 1;

        while (hi - lo > 1) {
            const mid = (lo + hi) >> 1;

            if (leg.cum[mid] <= along) {
                lo = mid;
            } else {
                hi = mid;
            }
        }

        const span = leg.cum[hi] - leg.cum[lo];
        // Past the end (overshooting), this extends the last segment.
        const point = towards(
            leg.points[lo],
            leg.points[hi],
            span > 0 ? (along - leg.cum[lo]) / span : 0,
        );
        const [a, b] = [leg.points[lo], leg.points[hi]];

        out.x = point.x;
        out.y = leg.pinned ? point.y + scroll : point.y;
        out.r = clamp(point.r, Math.min(a.r, b.r), Math.max(a.r, b.r));
        out.distance = leg.d0 + along;
        out.segment = leg.points.length > 1 ? leg.segment0 + lo : -1;

        return out;
    };

    return {
        segments,
        sample(scroll, out = emptySample()) {
            const first = legs[0];

            if (!first || scroll <= first.s0) {
                return Object.assign(out, {
                    ...rest,
                    distance: 0,
                    segment: -1,
                });
            }

            const leg =
                legs.find((candidate) => scroll < candidate.s1) ??
                legs[legs.length - 1];
            const t = clamp((scroll - leg.s0) / (leg.s1 - leg.s0), 0, 1);

            if (leg.spin > 0) {
                // Linear, to keep pace with the row, which slides linearly.
                const point = leg.points[0];

                return Object.assign(out, {
                    x: point.x,
                    y: leg.pinned ? point.y + scroll : point.y,
                    r: point.r,
                    distance: leg.d0 + t * leg.spin,
                    segment: leg.segment0,
                });
            }

            // Ease between the two keyframes around t.
            let k = 0;

            while (k < leg.keys.length - 2 && t > leg.keys[k + 1].t) {
                k++;
            }

            const [from, to] = [leg.keys[k], leg.keys[k + 1]];
            const share = clamp((t - from.t) / (to.t - from.t || 1), 0, 1);
            // Overshoot only into the leg's final stop.
            const local = leg.linear
                ? share
                : leg.settle > 0 && k === leg.keys.length - 2
                  ? overshoot(share, leg.settle)
                  : smoothstep(share);
            const along = lerp(leg.cum[from.index], leg.cum[to.index], local);

            return placeAt(leg, along, scroll, out);
        },
    };
}
