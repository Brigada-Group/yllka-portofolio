import type {
    OrbLayout,
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
    /** Distance rolled before this leg, and index of its first segment. */
    d0: number;
    segment0: number;
};

/** The point where the orb's current leg begins. */
type Cursor = { point: RoutePoint; scroll: number; bottom: number };

const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

const smoothstep = (t: number) => t * t * (3 - 2 * t);

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
 * Desktop: travel between gutters. Changing sides happens in the gap
 * between the two sections, so the orb never crosses text.
 */
function gutterLeg(from: Cursor, to: RoutePoint, toTop: number): RoutePoint[] {
    if (Math.abs(from.point.x - to.x) < 1) {
        return [from.point, to];
    }

    const gapY = (from.bottom + toTop) / 2;

    return roundCorners(
        [from.point, { ...from.point, y: gapY }, { ...to, y: gapY }, to],
        CORNER_RADIUS,
    );
}

/**
 * Compact (mobile): there are no gutters, so the orb shrinks into the
 * page margin, travels down the edge, and grows again above the next section.
 */
function edgeLeg(
    from: Cursor,
    to: RoutePoint,
    layout: OrbLayout,
): RoutePoint[] {
    const { width } = layout.viewport;
    const travelRadius = Math.max(3, layout.gutter / 2 - 2);
    const edge = (x: number) =>
        x < width / 2 ? layout.gutter / 2 : width - layout.gutter / 2;
    const fromEdge = edge(from.point.x);

    return roundCorners(
        [
            from.point,
            { x: fromEdge, y: from.point.y, r: travelRadius },
            { x: fromEdge, y: to.y, r: travelRadius },
            to,
        ],
        COMPACT_CORNER_RADIUS,
    );
}

/**
 * Pinned horizontal section: the orb enters the lane from one gutter,
 * pauses under each card in turn while the row slides left, then leaves
 * through the opposite gutter. Points are in screen space.
 */
function pinnedLeg(
    stop: OrbStop,
    radius: number,
): Pick<Leg, 'points' | 'keys'> {
    const pin = stop.pin!;
    const y = pin.screenTop + pin.laneY;
    const order = stop.side === 'left' ? pin.items : [...pin.items].reverse();
    const count = order.length;

    // At share t of the pin the row has slid t × overflow, so card k is
    // under the orb when the orb is at its centre minus that offset.
    const keys = [
        { x: pin.entryX, t: 0 },
        ...order.map((item, k) => {
            const t = (k + 1) / (count + 1);

            return { x: item.center - t * pin.overflow, t };
        }),
        { x: pin.exitX, t: 1 },
    ];

    return {
        points: keys.map(({ x }) => ({ x, y, r: radius })),
        keys: keys.map(({ t }, index) => ({ index, t })),
    };
}

/** How far the row in a pinned section has slid at a scroll position. */
export function pinnedRowOffset(stop: OrbStop, scroll: number): number {
    const pin = stop.pin!;
    const progress = clamp(
        (scroll - pin.start) / (pin.end - pin.start || 1),
        0,
        1,
    );

    return -progress * pin.overflow;
}

/**
 * Builds the orb's route through every stop. Scroll positions map to points
 * on the route, so the orb's position depends only on the scroll.
 */
export function buildOrbRoute(layout: OrbLayout, still: boolean): OrbRoute {
    const { stops, radius, compact, viewport, maxScroll } = layout;
    const first = stops[0];

    if (!first) {
        return staticRoute({ x: -9999, y: -9999, r: radius });
    }

    const rest: RoutePoint = { ...first.anchor, r: radius };

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
    };

    // Each leg starts after the previous one ends, even if the layout is too short to give it room.
    const after = (scroll: number) => Math.max(scroll, cursor.scroll + 1);

    for (const stop of stops.slice(1)) {
        const target: RoutePoint = { ...stop.anchor, r: radius };

        if (stop.pin) {
            const pin = stop.pin;
            const travel = gutterLeg(cursor, target, stop.bounds.top);
            legs.push({
                s0: cursor.scroll,
                s1: after(pin.start),
                pinned: false,
                points: travel,
                cum: cumulative(travel),
                keys: [
                    { index: 0, t: 0 },
                    { index: travel.length - 1, t: 1 },
                ],
            });

            const pinned = pinnedLeg(stop, radius);
            const s0 = after(pin.start);
            legs.push({
                s0,
                s1: Math.max(pin.end, s0 + 1),
                pinned: true,
                ...pinned,
                cum: cumulative(pinned.points),
            });

            // After the pin, the section has moved down by the pin's length.
            const shift = pin.end - pin.start;
            cursor = {
                point: { x: pin.exitX, y: stop.anchor.y + shift, r: radius },
                scroll: Math.max(pin.end, s0 + 1),
                bottom: stop.bounds.bottom + shift,
            };
            continue;
        }

        const points = compact
            ? edgeLeg(cursor, target, layout)
            : gutterLeg(cursor, target, stop.bounds.top);
        const s1 = after(arrival(stop.anchor.y));

        legs.push({
            s0: cursor.scroll,
            s1,
            pinned: false,
            points,
            cum: cumulative(points),
            keys: [
                { index: 0, t: 0 },
                { index: points.length - 1, t: 1 },
            ],
        });
        cursor = { point: target, scroll: s1, bottom: stop.bounds.bottom };
    }

    return createRoute(rest, legs);
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
        const point = towards(
            leg.points[lo],
            leg.points[hi],
            span > 0 ? (along - leg.cum[lo]) / span : 0,
        );

        out.x = point.x;
        out.y = leg.pinned ? point.y + scroll : point.y;
        out.r = point.r;
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

            // Ease between the two keyframes around t.
            let k = 0;

            while (k < leg.keys.length - 2 && t > leg.keys[k + 1].t) {
                k++;
            }

            const [from, to] = [leg.keys[k], leg.keys[k + 1]];
            const local = smoothstep(
                clamp((t - from.t) / (to.t - from.t || 1), 0, 1),
            );
            const along = lerp(leg.cum[from.index], leg.cum[to.index], local);

            return placeAt(leg, along, scroll, out);
        },
    };
}
