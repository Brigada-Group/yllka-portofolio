import { createPortal } from 'react-dom';
import type { OrbPathStore, OrbTiming } from './types';
import { useOrbLayout } from './use-orb-path';

const COLORS = { arrive: '#4ade80', depart: '#fb923c' } as const;

type Marker = {
    key: string;
    kind: keyof typeof COLORS;
    label: string;
    timing: OrbTiming;
};

/**
 * Debug markers for the orb's timing (`?orbDebug=1`), like ScrollTrigger's:
 * a line on the page where each stop's arrive (green) / depart (orange)
 * point is, and a tick fixed in the viewport where it fires. The orb
 * finishes arriving, or starts leaving, when the two meet.
 */
export default function OrbMarkers({ path }: { path: OrbPathStore }) {
    const layout = useOrbLayout(path);

    if (!layout) {
        return null;
    }

    const markers: Marker[] = layout.stops.flatMap((stop, index) => {
        const last = index === layout.stops.length - 1;
        const pinned = stop.pin
            ? {
                  arrive: {
                      scroll: stop.pin.start,
                      elementY: stop.pin.start,
                      viewportY: 0,
                  },
                  depart: {
                      scroll: stop.pin.end,
                      elementY: stop.pin.end,
                      viewportY: 0,
                  },
              }
            : null;
        const arrive = pinned?.arrive ?? stop.arrive;
        const depart = pinned?.depart ?? stop.depart;
        const clamped = (timing: OrbTiming) =>
            timing.scroll > layout.maxScroll ? ' (clamped to page end)' : '';
        const result: Marker[] = [];

        if (index > 0) {
            result.push({
                key: `${stop.id}-arrive`,
                kind: 'arrive',
                label: `${stop.id} ${pinned ? 'pin start' : 'arrive'}${clamped(arrive)}`,
                timing: arrive,
            });
        }

        if (!last) {
            result.push({
                key: `${stop.id}-depart`,
                kind: 'depart',
                label: `${stop.id} ${pinned ? 'pin end' : 'depart'}`,
                timing: depart,
            });
        }

        return result;
    });

    // One tick per viewport height, listing every marker that fires there.
    const ticks = new Map<number, Marker[]>();
    markers.forEach((marker) => {
        const y = Math.round(marker.timing.viewportY);
        ticks.set(y, [...(ticks.get(y) ?? []), marker]);
    });

    return createPortal(
        <div
            aria-hidden
            className="pointer-events-none font-mono text-[11px] uppercase"
        >
            {markers.map((marker) => (
                // On the page.
                <div
                    key={marker.key}
                    className="absolute left-0 z-[60] w-full border-t border-dashed"
                    style={{
                        top: marker.timing.elementY,
                        borderColor: COLORS[marker.kind],
                    }}
                >
                    <span
                        className="absolute right-28 -translate-y-full px-1"
                        style={{ color: COLORS[marker.kind] }}
                    >
                        {marker.label} @ {Math.round(marker.timing.scroll)}px
                    </span>
                </div>
            ))}
            {[...ticks].map(([y, group]) => (
                // In the viewport.
                <div
                    key={y}
                    className="fixed right-0 z-[60] w-24 border-t-2 border-white/60 bg-black/60 px-1 py-0.5"
                    style={{ top: y }}
                >
                    <span className="block text-white/60">
                        {Math.round((y / window.innerHeight) * 100)}% ↓
                    </span>
                    {group.map((marker) => (
                        <span
                            key={marker.key}
                            className="block"
                            style={{ color: COLORS[marker.kind] }}
                        >
                            {marker.label}
                        </span>
                    ))}
                </div>
            ))}
        </div>,
        document.body,
    );
}
