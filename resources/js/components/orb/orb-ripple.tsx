import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh, MeshBasicMaterial } from 'three';
import { docToWorld, pxToWorld } from './coordinates';
import type { OrbMotion } from './motion';
import type { OrbPathStore } from './types';

/** Delay of each ring, as a share of the ripple's progress. */
const RINGS = [0, 0.18];
/** How far the ripple spreads, in orb radii. */
const SPREAD = 7;
/** Tilt the rings back so they read as waves on a floor, not a flat circle. */
const FLOOR_TILT = -Math.PI / 2 + 0.35;

/**
 * Rings that spread from the orb's contact point on impact.
 */
export default function OrbRipple({
    path,
    motion,
}: {
    path: OrbPathStore;
    motion: OrbMotion;
}) {
    const rings = useRef<(Mesh | null)[]>([]);

    useFrame(({ size, viewport }) => {
        const layout = path.get();
        const stop = layout.stops[0];
        const radius = pxToWorld(layout.radius, size, viewport.width);

        rings.current.forEach((ring, index) => {
            if (!ring) {
                return;
            }

            const progress =
                (motion.ripple - RINGS[index]) / (1 - RINGS[index]);
            ring.visible = stop !== undefined && progress > 0 && progress < 1;

            if (!ring.visible || !stop) {
                return;
            }

            docToWorld(
                stop.anchor.x,
                stop.anchor.y + layout.radius,
                window.scrollY,
                size,
                viewport.width,
                ring.position,
            );
            ring.scale.setScalar(radius * (0.8 + progress * SPREAD));
            (ring.material as MeshBasicMaterial).opacity =
                (1 - progress) ** 2 * 0.6;
        });
    });

    return RINGS.map((_, index) => (
        <mesh
            key={index}
            ref={(mesh) => {
                rings.current[index] = mesh;
            }}
            rotation-x={FLOOR_TILT}
            visible={false}
        >
            <ringGeometry args={[0.96, 1, 96]} />
            <meshBasicMaterial color="#71717a" transparent depthWrite={false} />
        </mesh>
    ));
}
