import type {
    OrbLayout,
    OrbPinFrame,
    OrbRoute,
    OrbSample,
    OrbStop,
    RouteMark,
    RoutePoint,
    RouteSegment,
} from './types';

/**
 * The orb's route, as a pure function of the (lagged) scroll.
 *
 * Every stop is a ledge the orb sits on: the top of a dotless "ı", the
 * baseline right after a heading (as its full stop), a card track. Between
 * a stop's depart point and the next stop's arrive point the orb:
 *
 *   1. rolls off the end of its ledge,
 *   2. falls under gravity (ease-in on y), keeping its sideways momentum,
 *   3. lands at the next stop's level with a squash and one small bounce,
 *   4. rolls along that level onto the next anchor.
 *
 * Between arrive and depart it is parked. Scrolling up plays everything in reverse.
 */

/** The orb stays at least this far inside the viewport, in px. */
export const VIEWPORT_MARGIN = 24;

/** How far past the edge of its ledge the orb's centre gets before it drops, in radii. */
const ROLL_OFF = 0.5;
/** Sideways drift during a fall, in px (momentum from rolling off). */
const FALL_DRIFT = 8;
/** The bounce after landing: a share of the fall height, capped (px and radii). */
const BOUNCE_SHARE = 0.06;
const BOUNCE_MAX = 40;
const BOUNCE_MAX_RADII = 1.5;
/** Squash at impact (scaleY), and on the second, smaller touchdown. */
export const IMPACT_SQUASH = 0.85;
const SECOND_SQUASH = 0.93;
/** How long a squash lasts, as a share of the leg. */
const SQUASH_WIDTH = 0.025;

/** Share of a leg's scroll for each phase (normalised over the phases that happen). */
const SHARES = { rollOff: 0.12, fall: 0.48, bounce: 0.14, roll: 0.26 };

type Ease = (t: number) => number;
const linear: Ease = (t) => t;
const easeIn: Ease = (t) => t * t; // power2.in: gravity
const easeOut: Ease = (t) => 1 - (1 - t) * (1 - t);
const easeInOut: Ease = (t) => t * t * (3 - 2 * t);

/** A straight piece of a leg, from `t0` to `t1` of the leg's scroll. */
type Interval = {
    t0: number;
    t1: number;
    from: RoutePoint;
    to: RoutePoint;
    easeX: Ease;
    easeY: Ease;
    /** 1: rolling (rotation = distance / radius). Infinity: in the air, no rolling. */
    gear: number;
};

/** One piece of the route, travelled while the scroll moves from s0 to s1. */
type Leg = {
    s0: number;
    s1: number;
    /** Pinned legs are in screen space: their y follows the scroll. */
    pinned: boolean;
    intervals: Interval[];
    /** Shares of the leg at which the orb touches down (for the squash). */
    impacts: { t: number; squash: number }[];
    /** Pinned track this leg rolls on, onto or off (see OrbPinFrame). */
    frame: OrbPinFrame | null;
};

/** Where the orb is when its next leg begins. */
type Cursor = {
    point: RoutePoint;
    scroll: number;
    /** The x extent of what it is sitting on; it rolls off the right end. */
    ledge: { left: number; right: number };
};

/** Where a leg is heading. */
type Target = {
    point: RoutePoint;
    /** Where on its level it may land: any x in this range (free space, or a track). */
    landing: { min: number; max: number };
};

const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** How far a pinned section's row has slid at a scroll position. */
export function pinnedRowOffset(stop: OrbStop, scroll: number): number {
    return -pinProgress(stop, scroll) * stop.pin!.overflow;
}

/** How far through a pinned section the scroll is, from 0 to 1. */
export function pinProgress(stop: OrbStop, scroll: number): number {
    const pin = stop.pin!;

    return clamp((scroll - pin.start) / (pin.end - pin.start || 1), 0, 1);
}

/**
 * The phases from one stop to the next: roll off, fall, land and bounce,
 * roll onto the anchor. Phases that don't happen (no roll needed, no
 * drop) are skipped and the rest share the leg.
 */
function dropLeg(
    from: Cursor,
    to: Target,
    layout: OrbLayout,
): Pick<Leg, 'intervals' | 'impacts'> & { marks: RouteMark[] } {
    const { width } = layout.viewport;
    const inside = (x: number, r: number) =>
        clamp(x, VIEWPORT_MARGIN + r, width - VIEWPORT_MARGIN - r);
    const a = from.point;
    const b = to.point;

    // 1. Roll off the right end of the ledge.
    const off: RoutePoint = {
        x: inside(from.ledge.right + a.r * ROLL_OFF, a.r),
        y: a.y,
        r: a.r,
    };
    // 2. Fall, drifting a little; if that would land on content, the momentum carries it clear.
    const landX = inside(
        clamp(off.x + FALL_DRIFT, to.landing.min, to.landing.max),
        b.r,
    );
    const land: RoutePoint = { x: landX, y: b.y, r: b.r };
    // 3. Bounce once.
    const height = Math.max(0, b.y - a.y);
    const bounce = Math.min(
        height * BOUNCE_SHARE,
        BOUNCE_MAX,
        b.r * BOUNCE_MAX_RADII,
    );
    const top: RoutePoint = { ...land, y: land.y - bounce };

    type Phase = {
        share: number;
        to: RoutePoint;
        easeX: Ease;
        easeY: Ease;
        gear: number;
        impact?: number;
    };
    const phases: Phase[] = [];

    if (Math.abs(off.x - a.x) >= 1) {
        phases.push({
            share: SHARES.rollOff,
            to: off,
            easeX: easeIn,
            easeY: linear,
            gear: 1,
        });
    }

    if (Math.hypot(land.x - off.x, land.y - off.y) >= 1) {
        phases.push({
            share: SHARES.fall,
            to: land,
            easeX: linear,
            easeY: easeIn,
            gear: Infinity,
            impact: IMPACT_SQUASH,
        });
    }

    if (bounce >= 1) {
        phases.push({
            share: SHARES.bounce / 2,
            to: top,
            easeX: linear,
            easeY: easeOut,
            gear: Infinity,
        });
        phases.push({
            share: SHARES.bounce / 2,
            to: land,
            easeX: linear,
            easeY: easeIn,
            gear: Infinity,
            impact: SECOND_SQUASH,
        });
    }

    if (Math.abs(b.x - land.x) >= 1) {
        phases.push({
            share: SHARES.roll,
            to: b,
            easeX: easeInOut,
            easeY: linear,
            gear: 1,
        });
    }

    const total = phases.reduce((sum, phase) => sum + phase.share, 0) || 1;
    const intervals: Interval[] = [];
    const impacts: Leg['impacts'] = [];
    let t = 0;
    let at = a;

    for (const phase of phases) {
        const t1 = t + phase.share / total;
        intervals.push({
            t0: t,
            t1,
            from: at,
            to: phase.to,
            easeX: phase.easeX,
            easeY: phase.easeY,
            gear: phase.gear,
        });

        if (phase.impact !== undefined) {
            impacts.push({ t: t1, squash: phase.impact });
        }

        t = t1;
        at = phase.to;
    }

    // Nothing to do (already there): hold still for the leg.
    if (intervals.length === 0) {
        intervals.push({
            t0: 0,
            t1: 1,
            from: a,
            to: a,
            easeX: linear,
            easeY: linear,
            gear: 1,
        });
    }

    return {
        intervals,
        impacts,
        marks: [
            { kind: 'rolloff', x: off.x, y: off.y },
            { kind: 'landing', x: land.x, y: land.y },
        ],
    };
}

/**
 * Builds the orb's route through every stop. Scroll positions map to points
 * on the route, so the orb's position depends only on the scroll.
 */
export function buildOrbRoute(layout: OrbLayout, still: boolean): OrbRoute {
    const { stops, radius, maxScroll } = layout;
    const first = stops[0];

    if (!first) {
        return staticRoute({ x: -9999, y: -9999, r: radius });
    }

    const rest: RoutePoint = { ...first.anchor, r: first.radius };

    if (still) {
        return staticRoute(rest);
    }

    // A scroll position the page can actually reach: if the end of the page
    // comes first, the orb arrives (or leaves) there instead.
    const reachable = (scroll: number) => clamp(scroll, 0, maxScroll);
    const legs: Leg[] = [];
    const marks: RouteMark[] = stops.map((stop) => ({
        kind: 'ledge',
        x: stop.ledge.left,
        x1: stop.ledge.right,
        y: stop.anchor.y + stop.radius,
    }));

    // Parked at the first stop until it departs.
    let cursor: Cursor = {
        point: rest,
        scroll: reachable(first.depart.scroll),
        ledge: first.ledge,
    };
    // Set after a pinned track: the next leg starts on it, in the frame after the pin.
    let exitFrame: OrbPinFrame | null = null;

    // Each leg starts after the previous one ends, even if the layout is too short to give it room.
    const after = (scroll: number) => Math.max(scroll, cursor.scroll + 1);

    for (const stop of stops.slice(1)) {
        const point: RoutePoint = { ...stop.anchor, r: stop.radius };
        const lane = stop.lane;
        // Land anywhere on a track; otherwise in the free space right of the anchor (after the heading).
        const target: Target = {
            point,
            landing: lane
                ? { min: lane.start, max: lane.end }
                : { min: point.x, max: Infinity },
        };

        if (stop.pin && lane) {
            const pin = stop.pin;
            const span = pin.end - pin.start;
            const onTrack = { y: lane.y, start: pin.start, span, frame: 0 };
            const drop = dropLeg(cursor, target, layout);
            const s0 = after(pin.start);
            legs.push({
                s0: cursor.scroll,
                s1: s0,
                pinned: false,
                frame: { ...onTrack, pinned: false },
                intervals: drop.intervals,
                impacts: drop.impacts,
            });
            marks.push(...drop.marks);

            // Roll along the track at the pace of the pin: x is a straight
            // function of its progress. In screen space (pinned).
            const y = lane.y - pin.start;
            legs.push({
                s0,
                s1: Math.max(pin.end, s0 + 1),
                pinned: true,
                frame: { ...onTrack, pinned: true },
                impacts: [],
                intervals: [
                    {
                        t0: 0,
                        t1: 1,
                        from: { x: lane.start, y, r: lane.radius },
                        to: { x: lane.end, y, r: lane.radius },
                        easeX: linear,
                        easeY: linear,
                        gear: 1,
                    },
                ],
            });

            // After the pin, the section has moved down by the pin's length.
            exitFrame = {
                y: lane.y + span,
                start: pin.start,
                span,
                frame: span,
                pinned: false,
            };
            cursor = {
                point: { x: lane.end, y: lane.y + span, r: lane.radius },
                scroll: Math.max(pin.end, s0 + 1),
                ledge: stop.ledge,
            };
            continue;
        }

        // Fall from the last stop's departure, landing by this stop's arrive point.
        const arrive = after(reachable(stop.arrive.scroll));
        const drop = dropLeg(cursor, target, layout);
        legs.push({
            s0: cursor.scroll,
            s1: arrive,
            pinned: false,
            frame: exitFrame,
            intervals: drop.intervals,
            impacts: drop.impacts,
        });
        marks.push(...drop.marks);
        exitFrame = null;

        // Then park until its depart point (the gap between legs holds the orb still).
        cursor = {
            point,
            scroll: Math.max(reachable(stop.depart.scroll), arrive),
            ledge: stop.ledge,
        };
    }

    return createRoute(rest, legs, marks);
}

const emptySample = (): OrbSample => ({
    x: 0,
    y: 0,
    r: 0,
    distance: 0,
    segment: -1,
    frame: null,
    progress: 0,
    squash: 1,
});

function staticRoute(point: RoutePoint): OrbRoute {
    return {
        segments: [],
        marks: [],
        sample: (_scroll, out = emptySample()) =>
            Object.assign(out, emptySample(), {
                x: point.x,
                y: point.y,
                r: point.r,
            }),
    };
}

function createRoute(
    rest: RoutePoint,
    legs: Leg[],
    marks: RouteMark[],
): OrbRoute {
    // One segment per interval, in order, for the rotation table.
    const segments: RouteSegment[] = [];
    const firstSegment: number[] = [];
    let distance = 0;

    for (const leg of legs) {
        firstSegment.push(segments.length);

        for (const interval of leg.intervals) {
            const length = Math.hypot(
                interval.to.x - interval.from.x,
                interval.to.y - interval.from.y,
            );
            segments.push({
                d0: distance,
                length,
                dx: length > 0 ? (interval.to.x - interval.from.x) / length : 0,
                dy: length > 0 ? (interval.to.y - interval.from.y) / length : 0,
                r: (interval.from.r + interval.to.r) / 2,
                gear: interval.gear,
            });
            distance += length;
        }
    }

    return {
        segments,
        marks,
        sample(scroll, out = emptySample()) {
            const firstLeg = legs[0];

            if (!firstLeg || scroll <= firstLeg.s0) {
                return Object.assign(out, emptySample(), {
                    x: rest.x,
                    y: rest.y,
                    r: rest.r,
                });
            }

            // Between legs (parked), the next leg's start is where the orb rests.
            const index = legs.findIndex((leg) => scroll < leg.s1);
            const legIndex = index < 0 ? legs.length - 1 : index;
            const leg = legs[legIndex];
            const t = clamp((scroll - leg.s0) / (leg.s1 - leg.s0), 0, 1);

            let k = 0;

            while (k < leg.intervals.length - 1 && t > leg.intervals[k].t1) {
                k++;
            }

            const interval = leg.intervals[k];
            const share = clamp(
                (t - interval.t0) / (interval.t1 - interval.t0 || 1),
                0,
                1,
            );
            const ex = interval.easeX(share);
            const ey = interval.easeY(share);
            const segmentIndex = firstSegment[legIndex] + k;
            const segment = segments[segmentIndex];
            // Distance along the segment follows its main direction of travel.
            const along =
                Math.abs(segment.dx) >= Math.abs(segment.dy) ? ex : ey;

            out.x = lerp(interval.from.x, interval.to.x, ex);
            out.y =
                lerp(interval.from.y, interval.to.y, ey) +
                (leg.pinned ? scroll : 0);
            out.r = lerp(interval.from.r, interval.to.r, ex);
            out.distance = segment.d0 + segment.length * along;
            out.segment = segmentIndex;
            out.frame = leg.frame;
            out.progress = t;
            out.squash = leg.impacts.reduce((squash, impact) => {
                const d = (t - impact.t) / SQUASH_WIDTH;

                return squash * (1 - (1 - impact.squash) * Math.exp(-d * d));
            }, 1);

            return out;
        },
    };
}
