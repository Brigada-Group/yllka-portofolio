import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
    BufferGeometry,
    Float32BufferAttribute,
    Line,
    LineBasicMaterial,
    LineSegments,
    Vector3,
} from 'three';
import type { Group } from 'three';
import { docToWorld, pxToWorld } from './coordinates';
import type { OrbPathStore, OrbRoute, OrbSample } from './types';

const MAX_MARKERS = 16;
/** Path marks: ledges (cyan), roll-off points (orange), landings (green). */
const MARK_COLORS = {
    ledge: [0.13, 0.83, 0.93],
    rolloff: [0.98, 0.57, 0.24],
    landing: [0.29, 0.87, 0.5],
};
/** Half the size of a roll-off or landing cross, in px. */
const CROSS = 8;
/** Route samples per screen height. */
const TRACE_DENSITY = 120;

/**
 * Debug overlay (`?orbDebug=1`): a ring at every stop anchor, the orb's
 * route ahead of and behind the current scroll, and the computed path
 * marks: each ledge, where the orb rolls off, and where it lands.
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
    // The computed path: drawn in document px, moved and scaled into the scene each frame.
    const marks = useMemo(
        () =>
            new LineSegments(
                new BufferGeometry(),
                new LineBasicMaterial({
                    vertexColors: true,
                    transparent: true,
                    opacity: 0.9,
                }),
            ),
        [],
    );
    const marked = useRef<OrbRoute | null>(null);
    const traced = useRef<{ route: OrbRoute; scroll: number } | null>(null);
    const sample = useRef<OrbSample>({
        x: 0,
        y: 0,
        r: 0,
        distance: 0,
        segment: -1,
        frame: null,
        progress: 0,
        squash: 1,
    });

    useEffect(
        () => () => {
            trace.geometry.dispose();
            trace.material.dispose();
            marks.geometry.dispose();
            marks.material.dispose();
        },
        [trace, marks],
    );

    useFrame(({ size, viewport }) => {
        const layout = path.get();
        const route = path.route();
        const scroll = window.scrollY;
        const scale = pxToWorld(layout.radius, size, viewport.width);

        if (marked.current !== route) {
            const positions: number[] = [];
            const colors: number[] = [];
            const segment = (
                x0: number,
                y0: number,
                x1: number,
                y1: number,
                color: number[],
            ) => {
                positions.push(x0, y0, 0, x1, y1, 0);
                colors.push(...color, ...color);
            };

            for (const mark of route.marks) {
                const color = MARK_COLORS[mark.kind];

                if (mark.kind === 'ledge') {
                    segment(mark.x, mark.y, mark.x1, mark.y, color);
                } else {
                    segment(
                        mark.x - CROSS,
                        mark.y - CROSS,
                        mark.x + CROSS,
                        mark.y + CROSS,
                        color,
                    );
                    segment(
                        mark.x - CROSS,
                        mark.y + CROSS,
                        mark.x + CROSS,
                        mark.y - CROSS,
                        color,
                    );
                }
            }

            marks.geometry.setAttribute(
                'position',
                new Float32BufferAttribute(positions, 3),
            );
            marks.geometry.setAttribute(
                'color',
                new Float32BufferAttribute(colors, 3),
            );
            marked.current = route;
        }

        // Document px to world: x' = (x - w/2)·u, y' = (h/2 - (y - scroll))·u.
        const unitsPerPx = pxToWorld(1, size, viewport.width);
        marks.scale.set(unitsPerPx, -unitsPerPx, 1);
        marks.position.set(
            (-size.width / 2) * unitsPerPx,
            (size.height / 2 + scroll) * unitsPerPx,
            0,
        );

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
            <primitive object={marks} />
        </>
    );
}
