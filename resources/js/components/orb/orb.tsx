import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh } from 'three';
import { docToWorld, pxToWorld } from './coordinates';
import type { OrbPathStore } from './types';

type OrbProps = {
    path: OrbPathStore;
    quality: 'high' | 'low';
};

/**
 * Placeholder orb (phase 1): rests at the first stop and scrolls with the page.
 * The geometry is a unit sphere scaled to the measured radius, so resizing
 * never rebuilds geometry.
 */
export default function Orb({ path, quality }: OrbProps) {
    const mesh = useRef<Mesh>(null);
    const segments = quality === 'high' ? 64 : 32;

    useFrame(({ size, viewport }) => {
        const orb = mesh.current;
        const layout = path.get();
        const stop = layout.stops[0];

        if (!orb || !stop) {
            if (orb) {
                orb.visible = false;
            }

            return;
        }

        orb.visible = true;
        docToWorld(
            stop.anchor.x,
            stop.anchor.y,
            window.scrollY,
            size,
            viewport.width,
            orb.position,
        );
        orb.scale.setScalar(pxToWorld(layout.radius, size, viewport.width));
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
