import { gsap, ScrollTrigger } from '@/lib/gsap';
import { measureOrbLayout, SELECTORS } from './measure';
import { buildOrbRoute, pinnedRowOffset } from './route';
import type {
    OrbLayout,
    OrbPathOptions,
    OrbPathStore,
    OrbRoute,
    OrbSample,
    OrbStop,
} from './types';

export const ORB_STOP_SELECTOR = SELECTORS.stop;

/** Marks a stop whose section is pinned. CSS uses it to show the lane and clip the row. */
const PINNED_ATTRIBUTE = 'data-orb-pinned';
/** Set on the card the orb is currently under. */
const ACTIVE_ATTRIBUTE = 'data-orb-active';
/** Scroll length of a pinned section, per card plus one, as a share of the viewport height. */
const PIN_LENGTH_PER_ITEM = 0.55;

function createPin(
    element: HTMLElement,
    onUpdate: (self: ScrollTrigger) => void,
): ScrollTrigger {
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
        onUpdate,
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
    const sample: OrbSample = { x: 0, y: 0, r: 0, distance: 0, segment: -1 };
    let layout: OrbLayout;
    let route: OrbRoute;
    let frame = 0;
    let lastHeight = 0;

    /** Slide each pinned row and light up the card the orb is under. */
    const applyPin = (stop: OrbStop, scroll: number) => {
        const pin = stop.pin;

        if (!pin) {
            return;
        }

        const offset = pinnedRowOffset(stop, scroll);
        const pinned = scroll > pin.start && scroll < pin.end;
        const orbX = route.sample(scroll, sample).x;

        if (pin.row) {
            gsap.set(pin.row, { x: offset });
        }

        for (const item of pin.items) {
            const under =
                Math.abs(orbX - (item.center + offset)) < item.width / 2;
            item.element.toggleAttribute(ACTIVE_ATTRIBUTE, pinned && under);
        }
    };

    const applyPins = (scroll = window.scrollY) => {
        layout.stops.forEach((stop) => applyPin(stop, scroll));
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
                const trigger = createPin(element, (self) => {
                    const stop = layout.stops.find(
                        (candidate) => candidate.element === element,
                    );

                    if (stop) {
                        applyPin(stop, self.scroll());
                    }
                });
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

    measure();

    return {
        get: () => layout,
        route: () => route,
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
            ScrollTrigger.removeEventListener('refresh', refresh);
            pins.forEach((trigger, element) => removePin(element, trigger));
            pins.clear();
            listeners.clear();
        },
    };
}
