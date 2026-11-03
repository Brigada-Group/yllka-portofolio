import { gsap, ScrollTrigger } from '@/lib/gsap';
import { measureOrbLayout, SELECTORS } from './measure';
import { buildOrbRoute, pinnedRowOffset } from './route';
import type {
    OrbLayout,
    OrbSample,
    OrbPathOptions,
    OrbPathStore,
    OrbRoute,
    OrbStop,
} from './types';

export const ORB_STOP_SELECTOR = SELECTORS.stop;

/** Marks a stop whose section is pinned. CSS uses it to show the lane and clip the row. */
const PINNED_ATTRIBUTE = 'data-orb-pinned';
/** CSS custom property on each card: 1 when the orb is at its centre, falling to 0 a card's width away. */
const FOCUS_PROPERTY = '--orb-focus';
/** Set on a track entry once the orb has rolled past its top. */
const PASSED_ATTRIBUTE = 'data-orb-passed';
/** Set on a track stop while the orb drives it, so entries start dimmed (see app.css). */
const TRACK_READY_ATTRIBUTE = 'data-orb-track-ready';
/**
 * Catch-up lag: the orb (and the pinned rows it drives) follows a damped copy
 * of the scroll, closing about 95% of the gap in 1.2s, like ScrollTrigger's
 * `scrub: 1.2`. Per second.
 */
const SCROLL_LAG = 2.5;

/** Scroll position jumps larger than this many screens (restoring scroll, anchors) snap instead of easing. */
const SNAP_SCREENS = 2;

/** Scroll length of a pinned section, per card plus one, as a share of the viewport height. */
const PIN_LENGTH_PER_ITEM = 0.8;

function createPin(element: HTMLElement): ScrollTrigger {
    const section = element.closest<HTMLElement>('section') ?? element;
    const itemCount = () => element.querySelectorAll(SELECTORS.item).length;

    element.setAttribute(PINNED_ATTRIBUTE, '');
    element.querySelector(SELECTORS.viewport)?.scrollTo({ left: 0 });

    return ScrollTrigger.create({
        trigger: section,
        pin: section,
        // Centre short sections on screen; pin tall ones at the top.
        start: () =>
            section.offsetHeight >= window.innerHeight
                ? 'top top'
                : 'center center',
        end: () =>
            `+=${(itemCount() + 1) * window.innerHeight * PIN_LENGTH_PER_ITEM}`,
        invalidateOnRefresh: true,
    });
}

function removePin(element: HTMLElement, trigger: ScrollTrigger) {
    trigger.kill(true);
    element.removeAttribute(PINNED_ATTRIBUTE);

    const row = element.querySelector(SELECTORS.row);

    if (row) {
        gsap.set(row, { clearProps: 'transform' });
    }

    element
        .querySelectorAll<HTMLElement>(SELECTORS.item)
        .forEach((item) => item.style.removeProperty(FOCUS_PROPERTY));
}

/**
 * The orb's path: measured stops, the pins for horizontal sections, and the
 * route the orb follows. Re-measures on resize, ScrollTrigger refresh, page
 * height changes (images loading) and when stops are added, removed or edited.
 */
export function createOrbPath(
    root: HTMLElement,
    options: OrbPathOptions,
): OrbPathStore {
    const pins = new Map<HTMLElement, ScrollTrigger>();
    const listeners = new Set<() => void>();
    let layout: OrbLayout;
    let route: OrbRoute;
    let frame = 0;
    let lastHeight = 0;
    let scroll = window.scrollY;
    const sample: OrbSample = { x: 0, y: 0, r: 0, distance: 0, segment: -1 };

    /** Slide each pinned row and light up its cards one at a time, in order. */
    /** Slide each pinned row, and focus the cards by how close each is to the orb. */
    const applyPin = (stop: OrbStop, scroll: number, orbX: number) => {
        const pin = stop.pin;

        if (!pin) {
            return;
        }

        const offset = pinnedRowOffset(stop, scroll);

        if (pin.row) {
            gsap.set(pin.row, { x: offset });
        }

        for (const item of pin.items) {
            const distance = Math.abs(item.center + offset - orbX);
            const focus = Math.max(0, 1 - distance / item.width);
            item.element.style.setProperty(FOCUS_PROPERTY, focus.toFixed(3));
        }
    };

    /**
     * Unpinned lanes (small screens): the row scrolls natively, and the orb
     * rolls along the track in step with it. Shift per stop index, in px.
     */
    const laneShifts = new Map<number, number>();
    let laneListeners: (() => void)[] = [];

    const applyLaneScroll = (stop: OrbStop) => {
        const lane = stop.lane;
        const viewport = lane?.viewport;

        if (!lane || !viewport || options.still) {
            return;
        }

        const range = viewport.scrollWidth - viewport.clientWidth;
        const shift =
            range > 0
                ? (lane.end - lane.start) * (viewport.scrollLeft / range)
                : 0;
        laneShifts.set(stop.index, shift);

        // Focus the cards nearest the orb, as on the pinned version.
        const orbX = lane.start + shift - window.scrollX;
        for (const item of lane.items) {
            const rect = item.getBoundingClientRect();
            const distance = Math.abs(rect.left + rect.width / 2 - orbX);
            item.style.setProperty(
                FOCUS_PROPERTY,
                Math.max(0, 1 - distance / rect.width).toFixed(3),
            );
        }
    };

    const bindLanes = () => {
        laneListeners.forEach((unbind) => unbind());
        laneShifts.clear();
        laneListeners = layout.stops
            .filter((stop) => stop.lane && !stop.pin && stop.lane.viewport)
            .map((stop) => {
                const viewport = stop.lane!.viewport!;
                const onScroll = () => applyLaneScroll(stop);
                viewport.addEventListener('scroll', onScroll, {
                    passive: true,
                });
                onScroll();

                return () => viewport.removeEventListener('scroll', onScroll);
            });
    };

    /** Light up the entries beside a track once the orb has rolled past them. */
    const applyTrack = (stop: OrbStop, orbY: number) => {
        for (const entry of stop.track?.entries ?? []) {
            entry.element.toggleAttribute(PASSED_ATTRIBUTE, orbY >= entry.top);
        }
    };

    const applyPins = () => {
        const orb = route.sample(scroll, sample);
        layout.stops.forEach((stop) => {
            applyPin(stop, scroll, orb.x);
            applyTrack(stop, orb.y);
        });
    };

    // Ease the lagged scroll towards the real one, once per frame (after Lenis).
    const tick = (_time: number, deltaMs: number) => {
        const target = window.scrollY;
        const snap =
            options.still ||
            Math.abs(target - scroll) > window.innerHeight * SNAP_SCREENS;

        scroll = snap
            ? target
            : gsap.utils.interpolate(
                  scroll,
                  target,
                  1 - Math.exp(-SCROLL_LAG * (deltaMs / 1000)),
              );

        if (Math.abs(target - scroll) < 0.05) {
            scroll = target;
        }

        applyPins();
    };

    /** Create or remove pins to match the layout. Returns true if anything changed. */
    const syncPins = (next: OrbLayout): boolean => {
        const wanted = new Set(
            options.pinning && !next.compact
                ? next.stops
                      .filter((stop) => stop.mode === 'horizontal')
                      .map((stop) => stop.element)
                : [],
        );
        let changed = false;

        pins.forEach((trigger, element) => {
            if (!wanted.has(element)) {
                removePin(element, trigger);
                pins.delete(element);
                changed = true;
            }
        });

        wanted.forEach((element) => {
            if (!pins.has(element)) {
                const trigger = createPin(element);
                pins.set(element, trigger);
                changed = true;
            }
        });

        return changed;
    };

    const measure = () => {
        cancelAnimationFrame(frame);
        frame = 0;

        let next = measureOrbLayout(root, pins);

        // New or removed pins change the page height, so measure again once ScrollTrigger has laid them out.
        if (syncPins(next)) {
            ScrollTrigger.refresh();
            next = measureOrbLayout(root, pins);
        }

        layout = next;
        route = buildOrbRoute(layout, options.still);
        bindLanes();
        // Dim track entries until the orb reaches them, unless the orb stays still (reduced motion).
        layout.stops.forEach((stop) =>
            stop.element.toggleAttribute(
                TRACK_READY_ATTRIBUTE,
                stop.track !== null && !options.still,
            ),
        );
        lastHeight = layout.documentHeight;
        applyPins();
        listeners.forEach((listener) => listener());
    };

    const refresh = () => {
        if (frame === 0) {
            frame = requestAnimationFrame(measure);
        }
    };

    // The page grew or shrank (images, fonts, content). Pins need ScrollTrigger to recalculate first.
    const onResize = () => {
        const heightChanged =
            Math.abs(document.documentElement.scrollHeight - lastHeight) >= 1;

        if (heightChanged && pins.size > 0) {
            ScrollTrigger.refresh();
        } else {
            refresh();
        }
    };

    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(document.body);

    const mutationObserver = new MutationObserver(refresh);
    mutationObserver.observe(root, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-orb-stop', 'data-orb-mode', 'data-orb-side'],
    });

    window.addEventListener('resize', refresh);
    document.fonts?.addEventListener('loadingdone', refresh);
    ScrollTrigger.addEventListener('refresh', refresh);
    gsap.ticker.add(tick);

    measure();

    return {
        get: () => layout,
        route: () => route,
        scroll: () => scroll,
        laneShift: (point) => {
            let shift = 0;

            // Full shift while resting on the lane's start, fading out as the orb leaves it.
            laneShifts.forEach((dx, index) => {
                const stop = layout.stops[index];

                if (stop) {
                    const away = Math.hypot(
                        point.x - stop.anchor.x,
                        point.y - stop.anchor.y,
                    );
                    shift += dx * Math.max(0, 1 - away / (stop.radius * 2));
                }
            });

            return shift;
        },
        subscribe: (listener) => {
            listeners.add(listener);

            return () => listeners.delete(listener);
        },
        refresh,
        destroy: () => {
            cancelAnimationFrame(frame);
            gsap.ticker.remove(tick);
            laneListeners.forEach((unbind) => unbind());
            resizeObserver.disconnect();
            mutationObserver.disconnect();
            window.removeEventListener('resize', refresh);
            document.fonts?.removeEventListener('loadingdone', refresh);
            ScrollTrigger.removeEventListener('refresh', refresh);
            pins.forEach((trigger, element) => removePin(element, trigger));
            layout.stops.forEach((stop) =>
                stop.element.removeAttribute(TRACK_READY_ATTRIBUTE),
            );
            pins.clear();
            listeners.clear();
        },
    };
}
