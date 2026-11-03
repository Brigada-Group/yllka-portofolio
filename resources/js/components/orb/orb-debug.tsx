import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import { docToWorld, pxToWorld } from './coordinates';
import type { OrbPathStore } from './types';

const MAX_MARKERS = 16;

/**
 * Debug overlay, enabled with `?orb-debug` in the URL: a ring at every
 * stop anchor, so you can check DOM-to-world mapping and gutter placement.
 */
export default function OrbDebug({ path }: { path: OrbPathStore }) {
    const markers = useRef<(Group | null)[]>([]);

    useFrame(({ size, viewport }) => {
        const layout = path.get();
        const scale = pxToWorld(layout.radius, size, viewport.width);

        markers.current.forEach((marker, index) => {
            const stop = layout.stops[index];

            if (!marker) {
                return;
            }

            marker.visible = Boolean(stop);

            if (stop) {
                docToWorld(
                    stop.anchor.x,
                    stop.anchor.y,
                    window.scrollY,
                    size,
                    viewport.width,
                    marker.position,
                );
                marker.scale.setScalar(scale);
            }
        });
    });

    return Array.from({ length: MAX_MARKERS }, (_, index) => (
        <group
            key={index}
            visible={false}
            ref={(group) => {
                markers.current[index] = group;
            }}
        >
            <mesh>
                <ringGeometry args={[1.05, 1.12, 48]} />
                <meshBasicMaterial color="#ef4444" />
            </mesh>
        </group>
    ));
}
