import { Quaternion, Vector3 } from 'three';
import type { OrbRoute } from './types';

/**
 * The orb's rotation as a pure function of how far it has rolled, so
 * scrolling back retraces the exact same spin.
 *
 * Rolling on the page plane: moving in direction d (screen px, y down)
 * turns the orb about the axis (dy, dx, 0) in world space, by
 * distance / (radius × gear) radians. Gear 1 is true rolling (used on the
 * slow track legs); travel legs are geared down so quick scrolls don't strobe.
 */
export class OrbOrientation {
    private readonly starts: Quaternion[] = [];
    private readonly axes: Vector3[] = [];
    private readonly step = new Quaternion();

    /**
     * @param minRadius Never roll as if smaller than this (the orb's resting
     *   radius), so shrinking to travel along a narrow margin doesn't spin faster.
     */
    constructor(
        private readonly route: OrbRoute,
        private readonly minRadius: number,
    ) {
        let current = new Quaternion();

        for (const segment of route.segments) {
            const axis = new Vector3(segment.dy, segment.dx, 0);

            this.starts.push(current.clone());
            this.axes.push(axis);

            if (axis.lengthSq() > 0 && segment.r > 0) {
                current = new Quaternion()
                    .setFromAxisAngle(
                        axis,
                        segment.length /
                            this.rollRadius(segment.r, segment.gear),
                    )
                    .multiply(current);
            }
        }
    }

    /** True rolling uses the real radius; geared travel never rolls as if smaller than `minRadius`. */
    private rollRadius(radius: number, gear: number): number {
        return gear === 1 ? radius : Math.max(radius, this.minRadius) * gear;
    }

    /** Writes the orientation after rolling `distance` px along the route into `target`. */
    at(distance: number, target: Quaternion): Quaternion {
        const segments = this.route.segments;

        if (segments.length === 0 || distance <= 0) {
            return target.identity();
        }

        // Binary search for the segment containing the distance.
        let lo = 0;
        let hi = segments.length - 1;

        while (lo < hi) {
            const mid = (lo + hi + 1) >> 1;

            if (segments[mid].d0 <= distance) {
                lo = mid;
            } else {
                hi = mid - 1;
            }
        }

        const segment = segments[lo];
        const axis = this.axes[lo];

        if (axis.lengthSq() === 0 || segment.r === 0) {
            return target.copy(this.starts[lo]);
        }

        const along = Math.min(distance - segment.d0, segment.length);
        const angle = along / this.rollRadius(segment.r, segment.gear);

        return target.copy(
            this.step.setFromAxisAngle(axis, angle).multiply(this.starts[lo]),
        );
    }
}
