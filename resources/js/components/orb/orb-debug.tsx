import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
    BufferGeometry,
    Float32BufferAttribute,
    Line,
    LineBasicMaterial,
    Vector3,
} from 'three';
import type { Group } from 'three';
import { docToWorld, pxToWorld } from './coordinates';
import type { OrbPathStore, OrbRoute, OrbSample } from './types';

const MAX_MARKERS = 16;
/** Route samples per screen height. */
const TRACE_DENSITY = 120;

/**
 * Debug overlay, enabled with `?orb-debug` in the URL: a ring at every
 * stop anchor, and the orb's route ahead of and behind the current scroll.
 */
export default function OrbDebug({ path }: { path: OrbPathStore }) {
    const markers = useRef<(Group | null)[]>([]);
    const trace = useMemo(
        () =>
            new Line(
                new BufferGeometry(),
                new LineBasicMaterial({
                    color: '#ef4444',
                    transparent: true,
                    opacity: 0.5,
                }),
            ),
        [],
    );
    const point = useMemo(() => new Vector3(), []);
    const traced = useRef<{ route: OrbRoute; scroll: number } | null>(null);
    const sample = useRef<OrbSample>({
        x: 0,
        y: 0,
        r: 0,
        distance: 0,
        segment: -1,
        frame: null,
        progress: 0,
    });

    useEffect(
        () => () => {
            trace.geometry.dispose();
            trace.material.dispose();
        },
        [trace],
    );

    useFrame(({ size, viewport }) => {
        const layout = path.get();
        const route = path.route();
        const scroll = window.scrollY;
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
                    scroll,
                    size,
                    viewport.width,
                    marker.position,
                );
                marker.scale.setScalar(scale);
            }
        });

        // Trace the orb's document position for scroll positions around the current one.
        if (
            traced.current?.route !== route ||
            traced.current.scroll !== scroll
        ) {
            const positions: number[] = [];
            const span = size.height * 1.5;

            for (let i = 0; i <= TRACE_DENSITY * 3; i++) {
                const s = Math.max(
                    0,
                    scroll - span + (i / TRACE_DENSITY) * size.height,
                );
                const at = route.sample(s, sample.current);
                docToWorld(at.x, at.y, scroll, size, viewport.width, point);
                positions.push(point.x, point.y, point.z);
            }

            trace.geometry.setAttribute(
                'position',
                new Float32BufferAttribute(positions, 3),
            );
            traced.current = { route, scroll };
        }
    });

    return (
        <>
            {Array.from({ length: MAX_MARKERS }, (_, index) => (
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
            ))}
            <primitive object={trace} />
        </>
    );
}
