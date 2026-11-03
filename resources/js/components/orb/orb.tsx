import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh } from 'three';
import { docToWorld, pxToWorld } from './coordinates';
import type { OrbMotion } from './motion';
import type { OrbPathStore } from './types';

type OrbProps = {
    path: OrbPathStore;
    motion: OrbMotion;
    quality: 'high' | 'low';
};

/**
 * The orb. Rests at the first stop, offset and squashed by `motion`.
 * The geometry is a unit sphere scaled to the measured radius, so resizing
 * never rebuilds geometry.
 */
export default function Orb({ path, motion, quality }: OrbProps) {
    const mesh = useRef<Mesh>(null);
    const segments = quality === 'high' ? 64 : 32;

    useFrame(({ size, viewport }) => {
        const orb = mesh.current;

        if (!orb) {
            return;
        }

        const layout = path.get();
        const stop = layout.stops[0];
        orb.visible = motion.visible && stop !== undefined;

        if (!stop) {
            return;
        }

        const radius = layout.radius;
        // Squash around the contact point, so the bottom stays on the ground.
        const groundOffset = radius * (1 - motion.squash);

        docToWorld(
            stop.anchor.x,
            stop.anchor.y + motion.offsetY + groundOffset,
            window.scrollY,
            size,
            viewport.width,
            orb.position,
        );

        const scale = pxToWorld(radius, size, viewport.width);
        const sideways = scale / Math.sqrt(motion.squash);
        orb.scale.set(sideways, scale * motion.squash, sideways);
    });

    return (
        <mesh ref={mesh} visible={false}>
            <sphereGeometry args={[1, segments, segments / 2]} />
            <meshStandardMaterial
                color="#d4d4d8"
                roughness={0.3}
                metalness={0.1}
            />
        </mesh>
    );
}
