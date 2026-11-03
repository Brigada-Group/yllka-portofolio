import { Quaternion, Vector3 } from 'three';
import type { OrbRoute, OrbSample } from './types';

/**
 * The orb's rotation as a pure function of how far it has rolled, so
 * scrolling back retraces the exact same spin.
 *
 * Rolling on the page plane: moving in direction d (screen px, y down)
 * turns the orb about the axis (dy, dx, 0) in world space, by
 * distance / radius radians.
 */
export class OrbOrientation {
    private readonly starts: Quaternion[] = [];
    private readonly axes: Vector3[] = [];
    private readonly step = new Quaternion();

    constructor(private readonly route: OrbRoute) {
        let current = new Quaternion();

        for (const segment of route.segments) {
            const axis = new Vector3(segment.dy, segment.dx, 0);
            const usable = axis.lengthSq() > 0 && segment.r > 0;

            this.starts.push(current.clone());
            this.axes.push(axis);

            if (usable) {
                current = new Quaternion()
                    .setFromAxisAngle(axis, segment.length / segment.r)
                    .multiply(current);
            }
        }
    }

    /** Writes the orientation for a route sample into `target`. */
    at(sample: OrbSample, target: Quaternion): Quaternion {
        const segment = this.route.segments[sample.segment];

        if (!segment) {
            return target.identity();
        }

        const start = this.starts[sample.segment];
        const axis = this.axes[sample.segment];

        if (axis.lengthSq() === 0 || segment.r === 0) {
            return target.copy(start);
        }

        const angle = (sample.distance - segment.d0) / segment.r;

        return target.copy(
            this.step.setFromAxisAngle(axis, angle).multiply(start),
        );
    }
}
