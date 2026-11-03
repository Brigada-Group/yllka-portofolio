import { gsap } from '@/lib/gsap';
import type { ScrollTrigger } from '@/lib/gsap';
import type {
    DocPoint,
    DocRect,
    OrbLayout,
    OrbMode,
    OrbPin,
    OrbSide,
    OrbStop,
    OrbLane,
    OrbTiming,
    OrbTrack,
    OrbVia,
} from './types';

export const SELECTORS = {
    stop: '[data-orb-stop]',
    /** The clipping box of a horizontal row. Scrolls natively when not pinned. */
    viewport: '[data-orb-viewport]',
    /** The sliding row inside the viewport. */
    row: '[data-orb-row]',
    /** A card the orb presents. */
    item: '[data-orb-item]',
    /** The empty lane beside which the orb waits while a section is pinned. */
    lane: '[data-orb-lane]',
    /** Text the orb rests beside (on the stop's side) instead of out in the gutter. */
    beside: '[data-orb-beside]',
    /** A dotless "ı" whose missing dot the orb becomes, taking the dot's size. */
    dot: '[data-orb-dot]',
    /** An empty box the orb rests in, centred and sized to fit (min(width, height) / 2). */
    slot: '[data-orb-slot]',
    /** A vertical line the orb rolls down as the page scrolls; as wide as the orb. */
    track: '[data-orb-track]',
    /** An item beside a track, lit up once the orb has rolled past its top. */
    entry: '[data-orb-entry]',
} as const;

/** Space kept between the orb and content or the viewport edge. */
const MARGIN = 16;
const MIN_RADIUS = 18;
const MAX_RADIUS = 36;
const COMPACT_RADIUS = 18;
/** Below this width the orb uses its compact path, when no stop has a gutter to measure. */
const COMPACT_WIDTH = 768;
/** Space between text and an orb resting beside it. */
const BESIDE_GAP = 32;

const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

function readMode(element: HTMLElement): OrbMode {
    return element.dataset.orbMode === 'horizontal' ? 'horizontal' : 'vertical';
}

/**
 * How the orb reaches and leaves a stop that sits inside text
 * (`data-orb-via`): `right` along the line from the page's right margin,
 * or `down` from below. Anything else travels the usual way.
 */
function readVia(element: HTMLElement): OrbVia {
    const via = element.dataset.orbVia;

    return via === 'right' || via === 'down' ? via : 'none';
}

function readSide(element: HTMLElement): OrbSide {
    return element.dataset.orbSide === 'left' ? 'left' : 'right';
}

/** The element's content box in viewport px, excluding padding. */
function contentBox(element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const left = rect.left + parseFloat(style.paddingLeft);
    const right = rect.right - parseFloat(style.paddingRight);
    const top = rect.top + parseFloat(style.paddingTop);
    const bottom = rect.bottom - parseFloat(style.paddingBottom);

    return {
        top,
        bottom,
        left,
        right,
        width: right - left,
        height: bottom - top,
    };
}

/**
 * How far to shift viewport y to get document y in the pinned section's
 * pre-pin position. The pin spacer stays in the flow, so its top is where
 * the section sits before pinning, whatever the current scroll.
 */
function pinShift(trigger: ScrollTrigger | undefined): number {
    const section = trigger?.pin;
    const spacer = section?.parentElement;

    if (!section || !spacer?.classList.contains('pin-spacer')) {
        return 0;
    }

    return (
        spacer.getBoundingClientRect().top - section.getBoundingClientRect().top
    );
}

export function gutterWidth(
    bounds: DocRect,
    side: OrbSide,
    viewportWidth: number,
) {
    return side === 'left' ? bounds.left : viewportWidth - bounds.right;
}

/** The middle of the gutter on one side of the content. */
export function gutterCenter(
    bounds: DocRect,
    side: OrbSide,
    viewportWidth: number,
) {
    return side === 'left'
        ? bounds.left / 2
        : bounds.right + (viewportWidth - bounds.right) / 2;
}

/**
 * Where the orb rests for a stop. With room in the gutter it sits in the
 * middle of it, level with the top of the content. Without room (compact)
 * it sits just above the content, against the chosen edge, so it never
 * covers text.
 */
function resolveAnchor(
    element: HTMLElement,
    bounds: DocRect,
    side: OrbSide,
    radius: number,
    compact: boolean,
    viewportWidth: number,
): DocPoint {
    const beside = besideText(element, side, radius, viewportWidth);

    if (beside) {
        return beside;
    }

    if (compact) {
        return {
            x:
                side === 'left'
                    ? MARGIN + radius
                    : viewportWidth - MARGIN - radius,
            y: Math.max(radius, bounds.top - radius - MARGIN / 2),
        };
    }

    return {
        x: gutterCenter(bounds, side, viewportWidth),
        y: bounds.top + radius,
    };
}

/**
 * A resting point just past the end of the text in `[data-orb-beside]`,
 * vertically centred on it. Null when there is no such element or no room.
 */
function besideText(
    element: HTMLElement,
    side: OrbSide,
    radius: number,
    viewportWidth: number,
): DocPoint | null {
    const target = element.querySelector<HTMLElement>(SELECTORS.beside);

    if (!target) {
        return null;
    }

    // Union of the text itself: block children span the full width, their text doesn't.
    const box = {
        top: Infinity,
        bottom: -Infinity,
        left: Infinity,
        right: -Infinity,
    };
    const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
    const range = document.createRange();

    while (walker.nextNode()) {
        if (!walker.currentNode.textContent?.trim()) {
            continue;
        }

        range.selectNodeContents(walker.currentNode);

        for (const rect of range.getClientRects()) {
            box.top = Math.min(box.top, rect.top);
            box.bottom = Math.max(box.bottom, rect.bottom);
            box.left = Math.min(box.left, rect.left);
            box.right = Math.max(box.right, rect.right);
        }
    }

    if (box.top === Infinity) {
        return null;
    }

    const x =
        side === 'right'
            ? box.right + BESIDE_GAP + radius
            : box.left - BESIDE_GAP - radius;
    const fits =
        side === 'right'
            ? x + radius + MARGIN <= viewportWidth
            : x - radius - MARGIN >= 0;

    return fits
        ? {
              x: x + window.scrollX,
              y: (box.top + box.bottom) / 2 + window.scrollY,
          }
        : null;
}

/** Smallest orb that still reads as an orb, even when the dot it replaces is tiny. */
const MIN_DOT_RADIUS = 4;

let fontCanvas: CanvasRenderingContext2D | null = null;

/** Top-left of an element in document px, from layout offsets: transforms (reveal animations) don't move it. */
function layoutOffset(element: HTMLElement): DocPoint {
    let x = 0;
    let y = 0;

    for (
        let node: HTMLElement | null = element;
        node;
        node = node.offsetParent as HTMLElement | null
    ) {
        x += node.offsetLeft;
        y += node.offsetTop;
    }

    return { x, y };
}

/**
 * Where the dot of the `[data-orb-dot]` glyph (a dotless "ı") would be, and
 * how big, in document px. Measured from the element's actual font: the
 * dot sits as high as a dotted "i" reaches, centred over the stem and about
 * as wide as it. The orb is kept clear of the stem below.
 */
function dotSlot(
    element: HTMLElement,
): { anchor: DocPoint; radius: number } | null {
    const glyph = element.querySelector<HTMLElement>(SELECTORS.dot);

    if (!glyph || glyph.offsetWidth === 0) {
        return null;
    }

    const style = getComputedStyle(glyph);
    fontCanvas ??= document.createElement('canvas').getContext('2d');

    if (!fontCanvas) {
        return null;
    }

    fontCanvas.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const dotted = fontCanvas.measureText('i');
    const dotless = fontCanvas.measureText('ı');

    const stem = dotless.actualBoundingBoxLeft + dotless.actualBoundingBoxRight;
    const xHeight = dotless.actualBoundingBoxAscent;
    const dotTop = dotted.actualBoundingBoxAscent;
    const dotSize = Math.min(stem * 1.15, dotTop - xHeight);
    const centreAbove = dotTop - dotSize / 2;

    // The glyph's inline box starts at the font's ascent above the baseline.
    const { x, y } = layoutOffset(glyph);
    const baseline = y + dotless.fontBoundingBoxAscent;
    const centreX =
        x +
        (dotless.actualBoundingBoxRight - dotless.actualBoundingBoxLeft) / 2;
    const clearOfStem = centreAbove - xHeight - 1;

    return {
        anchor: { x: centreX, y: baseline - centreAbove },
        radius: Math.max(
            Math.min(MIN_DOT_RADIUS, clearOfStem),
            Math.min(dotSize / 2, clearOfStem),
        ),
    };
}

/** The centre and fitting radius of a `[data-orb-slot]` box, in document px. Null when hidden. */
function boxSlot(
    element: HTMLElement,
): { anchor: DocPoint; radius: number } | null {
    const slot = element.querySelector<HTMLElement>(SELECTORS.slot);

    if (!slot || slot.offsetWidth === 0 || slot.offsetHeight === 0) {
        return null;
    }

    const { x, y } = layoutOffset(slot);

    return {
        anchor: { x: x + slot.offsetWidth / 2, y: y + slot.offsetHeight / 2 },
        radius: Math.min(slot.offsetWidth, slot.offsetHeight) / 2,
    };
}

/**
 * A `[data-orb-track]` line: the orb rolls from its top to its bottom,
 * sized to the line's width, lighting up `[data-orb-entry]` items as it passes.
 */
function measureTrack(
    element: HTMLElement,
    maxRadius: number,
): { track: OrbTrack; radius: number } | null {
    const line = element.querySelector<HTMLElement>(SELECTORS.track);

    if (!line || line.offsetHeight === 0) {
        return null;
    }

    const { x, y } = layoutOffset(line);
    const radius = Math.min(line.offsetWidth / 2, maxRadius);
    const centre = x + line.offsetWidth / 2;

    return {
        radius,
        track: {
            top: { x: centre, y: y + radius },
            bottom: { x: centre, y: y + line.offsetHeight - radius },
            entries: Array.from(
                element.querySelectorAll<HTMLElement>(SELECTORS.entry),
            ).map((entry) => ({ element: entry, top: layoutOffset(entry).y })),
        },
    };
}

function measurePin(element: HTMLElement, trigger: ScrollTrigger): OrbPin {
    const row = element.querySelector<HTMLElement>(SELECTORS.row);
    const viewport =
        element.querySelector<HTMLElement>(SELECTORS.viewport) ??
        row?.parentElement ??
        null;
    const rowOffset = row ? Number(gsap.getProperty(row, 'x')) || 0 : 0;

    const items = Array.from(
        element.querySelectorAll<HTMLElement>(SELECTORS.item),
    ).map((item) => {
        const rect = item.getBoundingClientRect();

        return {
            element: item,
            center: rect.left + rect.width / 2 - rowOffset,
            width: rect.width,
        };
    });

    return {
        trigger,
        start: trigger.start,
        end: trigger.end,
        row,
        items,
        overflow:
            row && viewport
                ? Math.max(0, row.scrollWidth - viewport.clientWidth)
                : 0,
    };
}

/**
 * The track line of a `[data-orb-lane]`, drawn along the lane's bottom edge:
 * the orb sits on it, sized to the lane's height, and rolls from its left
 * end to its right end. Document px; `shiftY` moves a pinned section back to
 * where it sits before the pin.
 */
function measureLane(
    element: HTMLElement,
    maxRadius: number,
    shiftY: number,
): OrbLane | null {
    const lane = element.querySelector<HTMLElement>(SELECTORS.lane);
    const rect = lane?.getBoundingClientRect();

    if (!lane || !rect || rect.width === 0) {
        return null;
    }

    const radius = Math.max(4, Math.min(rect.height / 2 - 4, maxRadius));
    const left = rect.left + window.scrollX;

    return {
        start: left + radius,
        end: left + rect.width - radius,
        y: rect.bottom + shiftY - radius - 0.5,
        radius,
        viewport: element.querySelector<HTMLElement>(SELECTORS.viewport),
        items: Array.from(
            element.querySelectorAll<HTMLElement>(SELECTORS.item),
        ),
    };
}

/** When the orb must have arrived at a stop, and when it may leave: ScrollTrigger-style positions. */
const DEFAULT_ARRIVE = 'top 60%';
const DEFAULT_DEPART = 'bottom 80%';

/**
 * Resolves a ScrollTrigger-style position ("top 60%", "center center",
 * "bottom 80%", "120px top") against an element's box, or a plain number as
 * an absolute scroll position. Returns where on the element and where in the
 * viewport the two meet, and the scroll position at which they do.
 */
export function resolvePosition(
    value: string,
    box: { top: number; bottom: number },
    viewportHeight: number,
): OrbTiming {
    const trimmed = value.trim();

    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
        const scroll = Number(trimmed);

        return { scroll, elementY: scroll, viewportY: 0 };
    }

    const [edge = 'top', place = 'top'] = trimmed.split(/\s+/);
    const height = box.bottom - box.top;
    const along = (token: string, size: number) => {
        if (token === 'top') return 0;
        if (token === 'center') return size / 2;
        if (token === 'bottom') return size;
        if (token.endsWith('%')) return (parseFloat(token) / 100) * size;

        return parseFloat(token) || 0;
    };
    const elementY = box.top + along(edge, height);
    const viewportY = along(place, viewportHeight);

    return { scroll: elementY - viewportY, elementY, viewportY };
}

function readTiming(
    element: HTMLElement,
    box: { top: number; bottom: number },
    viewportHeight: number,
): { arrive: OrbTiming; depart: OrbTiming } {
    return {
        arrive: resolvePosition(
            element.dataset.orbArrive ?? DEFAULT_ARRIVE,
            box,
            viewportHeight,
        ),
        depart: resolvePosition(
            element.dataset.orbDepart ?? DEFAULT_DEPART,
            box,
            viewportHeight,
        ),
    };
}

/**
 * Measure every `[data-orb-stop]` element under `root`, in DOM order.
 * `pins` maps stop elements to the ScrollTriggers pinning their sections.
 */
export function measureOrbLayout(
    root: ParentNode,
    pins: ReadonlyMap<HTMLElement, ScrollTrigger>,
): OrbLayout {
    const viewport = {
        width: document.documentElement.clientWidth,
        height: window.innerHeight,
    };
    const documentHeight = document.documentElement.scrollHeight;
    const base = {
        viewport,
        documentHeight,
        maxScroll: Math.max(0, documentHeight - viewport.height),
    };

    const measured = Array.from(
        root.querySelectorAll<HTMLElement>(SELECTORS.stop),
    )
        .map((element) => {
            const box = contentBox(element);
            const shiftY = window.scrollY + pinShift(pins.get(element));

            const section = element.closest('section') ?? element;
            const sectionRect = section.getBoundingClientRect();

            return {
                element,
                mode: readMode(element),
                side: readSide(element),
                bounds: {
                    ...box,
                    top: box.top + shiftY,
                    bottom: box.bottom + shiftY,
                    left: box.left + window.scrollX,
                    right: box.right + window.scrollX,
                },
                section: {
                    top: sectionRect.top + shiftY,
                    bottom: sectionRect.bottom + shiftY,
                },
            };
        })
        // Skip stops that are not rendered (display: none, or hidden at this breakpoint).
        .filter(({ bounds }) => bounds.width > 0 || bounds.height > 0);

    if (measured.length === 0) {
        return {
            ...base,
            stops: [],
            radius: MIN_RADIUS,
            compact: false,
            gutter: 0,
        };
    }

    // Stops that place the orb themselves (in a letter, a slot, on a track or
    // a lane) don't need a gutter beside their content.
    const slots = measured.map(
        ({ element }) => dotSlot(element) ?? boxSlot(element),
    );
    const placesOrb = measured.map(
        ({ element, mode }, index) =>
            slots[index] !== null ||
            element.querySelector(SELECTORS.track) !== null ||
            (mode === 'horizontal' &&
                element.querySelector(SELECTORS.lane) !== null),
    );

    // Size the orb to the narrowest gutter it has to travel through. Without
    // any gutter stops, go compact on small screens.
    const gutters = measured
        .filter((_, index) => !placesOrb[index])
        .map(({ bounds, side }) => gutterWidth(bounds, side, viewport.width));
    const gutter = gutters.length > 0 ? Math.min(...gutters) : viewport.width;
    const compact =
        gutters.length > 0
            ? gutter < MIN_RADIUS * 2 + MARGIN * 2
            : viewport.width < COMPACT_WIDTH;
    const radius = compact
        ? COMPACT_RADIUS
        : clamp((gutter - MARGIN * 2) / 2, MIN_RADIUS, MAX_RADIUS);

    const stops: OrbStop[] = measured.map(
        ({ element, mode, side, bounds, section }, index) => {
            const trigger = compact ? undefined : pins.get(element);
            const pin = trigger ? measurePin(element, trigger) : null;
            const slot = slots[index];
            const track = slot ? null : measureTrack(element, radius);
            const lane =
                mode === 'horizontal'
                    ? measureLane(
                          element,
                          radius,
                          window.scrollY + pinShift(pins.get(element)),
                      )
                    : null;
            const common = {
                id: element.dataset.orbStop || `stop-${index}`,
                index,
                mode,
                side,
                element,
                bounds,
                via: readVia(element),
                margin: viewport.width - bounds.right,
                section,
                ...readTiming(
                    element,
                    element.dataset.orbTrigger === 'self' ? bounds : section,
                    viewport.height,
                ),
                pin: null,
                lane: null,
                track: null,
            };

            if (slot) {
                return {
                    ...common,
                    anchor: slot.anchor,
                    radius: slot.radius,
                    letter: true,
                };
            }

            if (track) {
                // Roll down the line while it passes 60% of the viewport, so the orb stays level on screen.
                const line = {
                    top: track.track.top.y - track.radius,
                    bottom: track.track.bottom.y + track.radius,
                };
                const timing = {
                    arrive: resolvePosition(
                        element.dataset.orbArrive ?? 'top 60%',
                        line,
                        viewport.height,
                    ),
                    depart: resolvePosition(
                        element.dataset.orbDepart ?? 'bottom 60%',
                        line,
                        viewport.height,
                    ),
                };

                return {
                    ...common,
                    ...timing,
                    anchor: track.track.top,
                    radius: track.radius,
                    letter: false,
                    track: track.track,
                };
            }

            if (lane) {
                return {
                    ...common,
                    anchor: { x: lane.start, y: lane.y },
                    radius: lane.radius,
                    letter: false,
                    pin,
                    lane,
                };
            }

            return {
                ...common,
                anchor: resolveAnchor(
                    element,
                    bounds,
                    side,
                    radius,
                    compact,
                    viewport.width,
                ),
                radius,
                letter: false,
                pin,
            };
        },
    );

    return { ...base, stops, radius, compact, gutter };
}
