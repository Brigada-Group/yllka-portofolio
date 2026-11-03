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
} as const;

/** Space kept between the orb and content or the viewport edge. */
const MARGIN = 16;
const MIN_RADIUS = 18;
const MAX_RADIUS = 36;
const COMPACT_RADIUS = 18;
/** Space between text and an orb resting beside it. */
const BESIDE_GAP = 32;

const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

function readMode(element: HTMLElement): OrbMode {
    return element.dataset.orbMode === 'horizontal' ? 'horizontal' : 'vertical';
}

/** How the orb leaves a stop it rests inside the text of: `right` along the line, or `down` below it. */
function readExit(element: HTMLElement): 'down' | 'right' {
    return element.dataset.orbExit === 'right' ? 'right' : 'down';
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

function measurePin(
    element: HTMLElement,
    trigger: ScrollTrigger,
    bounds: DocRect,
    side: OrbSide,
    viewportWidth: number,
): OrbPin {
    const section = (trigger.pin as HTMLElement | undefined) ?? element;
    const sectionRect = section.getBoundingClientRect();
    const sectionTop = sectionRect.top + window.scrollY + pinShift(trigger);

    const row = element.querySelector<HTMLElement>(SELECTORS.row);
    const viewport =
        element.querySelector<HTMLElement>(SELECTORS.viewport) ??
        row?.parentElement ??
        null;
    const rowOffset = row ? Number(gsap.getProperty(row, 'x')) || 0 : 0;

    const lane = element.querySelector<HTMLElement>(SELECTORS.lane);
    const laneRect = lane?.getBoundingClientRect();
    // Without a lane, roll along the bottom edge of the content.
    const laneY = laneRect
        ? laneRect.top + laneRect.height / 2 - sectionRect.top
        : bounds.bottom - sectionTop;

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
        screenTop: sectionTop - trigger.start,
        laneY,
        row,
        items,
        overflow:
            row && viewport
                ? Math.max(0, row.scrollWidth - viewport.clientWidth)
                : 0,
        entryX: gutterCenter(bounds, side, viewportWidth),
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

    const slots = measured.map(({ element }) => dotSlot(element));

    // Size the orb to the narrowest gutter it has to travel through. Stops
    // where it sits in a letter don't use their gutter.
    const gutters = measured
        .filter((_, index) => !slots[index])
        .map(({ bounds, side }) => gutterWidth(bounds, side, viewport.width));
    const gutter = gutters.length > 0 ? Math.min(...gutters) : viewport.width;
    const compact = gutter < MIN_RADIUS * 2 + MARGIN * 2;
    const radius = compact
        ? COMPACT_RADIUS
        : clamp((gutter - MARGIN * 2) / 2, MIN_RADIUS, MAX_RADIUS);

    const stops: OrbStop[] = measured.map(
        ({ element, mode, side, bounds }, index) => {
            const trigger = compact ? undefined : pins.get(element);
            const pin = trigger
                ? measurePin(element, trigger, bounds, side, viewport.width)
                : null;
            const slot = slots[index];

            if (slot) {
                return {
                    id: element.dataset.orbStop || `stop-${index}`,
                    index,
                    mode,
                    side,
                    element,
                    bounds,
                    anchor: slot.anchor,
                    radius: slot.radius,
                    letter: true,
                    exit: readExit(element),
                    pin: null,
                };
            }

            return {
                id: element.dataset.orbStop || `stop-${index}`,
                index,
                mode,
                side,
                element,
                bounds,
                anchor: pin
                    ? {
                          x: pin.entryX,
                          y: pin.screenTop + pin.start + pin.laneY,
                      }
                    : resolveAnchor(
                          element,
                          bounds,
                          side,
                          radius,
                          compact,
                          viewport.width,
                      ),
                radius,
                letter: false,
                exit: readExit(element),
                pin,
            };
        },
    );

    return { ...base, stops, radius, compact, gutter };
}
