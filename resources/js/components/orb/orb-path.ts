import type {
    DocPoint,
    DocRect,
    OrbLayout,
    OrbMode,
    OrbPathStore,
    OrbSide,
    OrbStop,
} from './types';

export const ORB_STOP_SELECTOR = '[data-orb-stop]';

/** Space kept between the orb and content or the viewport edge. */
const MARGIN = 16;
const MIN_RADIUS = 24;
const MAX_RADIUS = 60;
const COMPACT_RADIUS = 22;

const EMPTY_LAYOUT: OrbLayout = {
    stops: [],
    radius: MIN_RADIUS,
    compact: false,
    viewport: { width: 0, height: 0 },
    documentHeight: 0,
};

const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

function readMode(element: HTMLElement): OrbMode {
    return element.dataset.orbMode === 'horizontal' ? 'horizontal' : 'vertical';
}

function readSide(element: HTMLElement): OrbSide {
    return element.dataset.orbSide === 'left' ? 'left' : 'right';
}

function toDocRect(rect: DOMRect, scrollX: number, scrollY: number): DocRect {
    return {
        top: rect.top + scrollY,
        bottom: rect.bottom + scrollY,
        left: rect.left + scrollX,
        right: rect.right + scrollX,
        width: rect.width,
        height: rect.height,
    };
}

function gutterWidth(bounds: DocRect, side: OrbSide, viewportWidth: number) {
    return side === 'left' ? bounds.left : viewportWidth - bounds.right;
}

/**
 * Where the orb rests for a stop. With room in the gutter it sits in the
 * middle of it, level with the top of the content. Without room (compact)
 * it sits just above the content, against the chosen edge, so it never
 * covers text.
 */
function resolveAnchor(
    bounds: DocRect,
    side: OrbSide,
    radius: number,
    compact: boolean,
    viewportWidth: number,
): DocPoint {
    if (compact) {
        return {
            x:
                side === 'left'
                    ? MARGIN + radius
                    : viewportWidth - MARGIN - radius,
            y: Math.max(radius, bounds.top - radius - MARGIN / 2),
        };
    }

    const gutter = gutterWidth(bounds, side, viewportWidth);

    return {
        x: side === 'left' ? gutter / 2 : bounds.right + gutter / 2,
        y: bounds.top + radius,
    };
}

/** Measure every `[data-orb-stop]` element under `root`, in DOM order. */
export function measureOrbLayout(root: ParentNode): OrbLayout {
    const viewport = {
        width: document.documentElement.clientWidth,
        height: window.innerHeight,
    };
    const { scrollX, scrollY } = window;

    const measured = Array.from(
        root.querySelectorAll<HTMLElement>(ORB_STOP_SELECTOR),
    )
        .map((element) => ({
            element,
            mode: readMode(element),
            side: readSide(element),
            rect: element.getBoundingClientRect(),
        }))
        // Skip stops that are hidden (display: none, or not rendered at this breakpoint).
        .filter(({ rect }) => rect.width > 0 || rect.height > 0)
        .map((stop) => ({
            ...stop,
            bounds: toDocRect(stop.rect, scrollX, scrollY),
        }));

    if (measured.length === 0) {
        return { ...EMPTY_LAYOUT, viewport };
    }

    // Size the orb to the narrowest gutter it has to travel through.
    const narrowestGutter = Math.min(
        ...measured.map(({ bounds, side }) =>
            gutterWidth(bounds, side, viewport.width),
        ),
    );
    const compact = narrowestGutter < MIN_RADIUS * 2 + MARGIN * 2;
    const radius = compact
        ? COMPACT_RADIUS
        : clamp((narrowestGutter - MARGIN * 2) / 2, MIN_RADIUS, MAX_RADIUS);

    const stops: OrbStop[] = measured.map(
        ({ element, mode, side, bounds }, index) => ({
            id: element.dataset.orbStop || `stop-${index}`,
            index,
            mode,
            side,
            element,
            bounds,
            anchor: resolveAnchor(
                bounds,
                side,
                radius,
                compact,
                viewport.width,
            ),
        }),
    );

    return {
        stops,
        radius,
        compact,
        viewport,
        documentHeight: document.documentElement.scrollHeight,
    };
}

/**
 * A small external store holding the measured orb layout. It re-measures
 * on resize, when the page height changes (images loading, content edits),
 * and when stops are added, removed or their data attributes change.
 */
export function createOrbPath(root: HTMLElement = document.body): OrbPathStore {
    let layout = measureOrbLayout(root);
    let frame = 0;
    const listeners = new Set<() => void>();

    const measure = () => {
        frame = 0;
        layout = measureOrbLayout(root);
        listeners.forEach((listener) => listener());
    };

    const refresh = () => {
        if (frame === 0) {
            frame = requestAnimationFrame(measure);
        }
    };

    const resizeObserver = new ResizeObserver(refresh);
    resizeObserver.observe(document.documentElement);
    resizeObserver.observe(root);

    const mutationObserver = new MutationObserver(refresh);
    mutationObserver.observe(root, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-orb-stop', 'data-orb-mode', 'data-orb-side'],
    });

    window.addEventListener('resize', refresh);

    return {
        get: () => layout,
        subscribe: (listener) => {
            listeners.add(listener);

            return () => listeners.delete(listener);
        },
        refresh,
        destroy: () => {
            cancelAnimationFrame(frame);
            resizeObserver.disconnect();
            mutationObserver.disconnect();
            window.removeEventListener('resize', refresh);
            listeners.clear();
        },
    };
}
