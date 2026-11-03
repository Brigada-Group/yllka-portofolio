import { gsap, ScrollTrigger } from '@/lib/gsap';
import { measureOrbLayout, SELECTORS } from './measure';
import { buildOrbRoute, pinnedRowOffset, pinProgress } from './route';
import type {
    OrbLayout,
    OrbPathOptions,
    OrbPathStore,
    OrbRoute,
    OrbStop,
} from './types';

export const ORB_STOP_SELECTOR = SELECTORS.stop;

/** Marks a stop whose section is pinned. CSS uses it to show the lane and clip the row. */
const PINNED_ATTRIBUTE = 'data-orb-pinned';
/** Set on the card the orb is currently under. */
const ACTIVE_ATTRIBUTE = 'data-orb-active';
/**
 * Catch-up lag: the orb (and the pinned rows it drives) follows a damped copy
 * of the scroll, closing about 95% of the gap in 1.2s, like ScrollTrigger's
 * `scrub: 1.2`. Per second.
 */
const SCROLL_LAG = 2.5;

/** Scroll position jumps larger than this many screens (restoring scroll, anchors) snap instead of easing. */
const SNAP_SCREENS = 2;

/** Scroll length of a pinned section, per card plus one, as a share of the viewport height. */
const PIN_LENGTH_PER_ITEM = 0.55;

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
        .querySelectorAll(`[${ACTIVE_ATTRIBUTE}]`)
        .forEach((item) => item.removeAttribute(ACTIVE_ATTRIBUTE));
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

    /** Slide each pinned row and light up its cards one at a time, in order. */
    const applyPin = (stop: OrbStop, scroll: number) => {
        const pin = stop.pin;

        if (!pin) {
            return;
        }

        const pinned = scroll > pin.start && scroll < pin.end;
        const active = Math.min(
            pin.items.length - 1,
            Math.floor(pinProgress(stop, scroll) * pin.items.length),
        );

        if (pin.row) {
            gsap.set(pin.row, { x: pinnedRowOffset(stop, scroll) });
        }

        pin.items.forEach((item, index) => {
            item.element.toggleAttribute(
                ACTIVE_ATTRIBUTE,
                pinned && index === active,
            );
        });
    };

    const applyPins = () => {
        layout.stops.forEach((stop) => applyPin(stop, scroll));
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
    ScrollTrigger.addEventListener('refresh', refresh);
    gsap.ticker.add(tick);

    measure();

    return {
        get: () => layout,
        route: () => route,
        scroll: () => scroll,
        subscribe: (listener) => {
            listeners.add(listener);

            return () => listeners.delete(listener);
        },
        refresh,
        destroy: () => {
            cancelAnimationFrame(frame);
            gsap.ticker.remove(tick);
            resizeObserver.disconnect();
            mutationObserver.disconnect();
            window.removeEventListener('resize', refresh);
            ScrollTrigger.removeEventListener('refresh', refresh);
            pins.forEach((trigger, element) => removePin(element, trigger));
            pins.clear();
            listeners.clear();
        },
    };
}
