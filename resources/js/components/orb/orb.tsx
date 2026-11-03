import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';
import type { Mesh } from 'three';
import { docToWorld, pxToWorld } from './coordinates';
import type { OrbMotion } from './motion';
import { OrbOrientation } from './orientation';
import type { OrbPathStore, OrbRoute, OrbSample } from './types';

type OrbProps = {
    path: OrbPathStore;
    motion: OrbMotion;
    quality: 'high' | 'low';
};

/**
 * Placeholder surface: an equator and two meridians, so rolling is visible.
 * Replaced by the glass material in phase 5.
 */
function createStripeTexture(): CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const context = canvas.getContext('2d')!;

    context.fillStyle = '#d4d4d8';
    context.fillRect(0, 0, 512, 256);
    context.fillStyle = '#71717a';
    context.fillRect(0, 122, 512, 12);
    context.fillRect(0, 0, 10, 256);
    context.fillRect(251, 0, 10, 256);

    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;

    return texture;
}

/**
 * The orb. Follows the route for the current scroll, rolling as it goes,
 * with the intro's drop offset and squash applied on top. The geometry is a
 * unit sphere scaled to the measured radius, so resizing never rebuilds it.
 */
export default function Orb({ path, motion, quality }: OrbProps) {
    const mesh = useRef<Mesh>(null);
    const segments = quality === 'high' ? 64 : 32;
    const texture = useMemo(createStripeTexture, []);
    const sample = useRef<OrbSample>({
        x: 0,
        y: 0,
        r: 0,
        distance: 0,
        segment: -1,
    });
    const orientation = useRef<{
        route: OrbRoute;
        table: OrbOrientation;
    } | null>(null);

    useEffect(() => () => texture.dispose(), [texture]);

    useFrame(({ size, viewport }) => {
        const orb = mesh.current;

        if (!orb) {
            return;
        }

        const route = path.route();
        const point = route.sample(window.scrollY, sample.current);
        orb.visible = motion.visible && path.get().stops.length > 0;

        // Rebuild the rotation table when the route is re-measured.
        if (orientation.current?.route !== route) {
            orientation.current = { route, table: new OrbOrientation(route) };
        }

        // Squash around the contact point, so the bottom stays on the ground.
        const groundOffset = point.r * (1 - motion.squash);

        docToWorld(
            point.x,
            point.y + motion.offsetY + groundOffset,
            window.scrollY,
            size,
            viewport.width,
            orb.position,
        );
        orientation.current.table.at(point, orb.quaternion);

        const scale = pxToWorld(point.r, size, viewport.width);
        const sideways = scale / Math.sqrt(motion.squash);
        orb.scale.set(sideways, scale * motion.squash, sideways);
    });

    return (
        <mesh ref={mesh} visible={false}>
            <sphereGeometry args={[1, segments, segments / 2]} />
            <meshStandardMaterial
                map={texture}
                roughness={0.35}
                metalness={0.05}
            />
        </mesh>
    );
}
