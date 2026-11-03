import { MeshTransmissionMaterial } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { MathUtils, Quaternion, Vector3 } from 'three';
import type { Group, Mesh, MeshBasicMaterial } from 'three';
import { docToWorld, pxToWorld } from './coordinates';
import type { OrbMotion } from './motion';
import { OrbOrientation } from './orientation';
import {
    createEtchTexture,
    createRefractionTexture,
    createShadowTexture,
} from './textures';
import type { OrbPathStore, OrbRoute, OrbSample } from './types';
import { useOrbPointer } from './use-orb-pointer';

type OrbProps = {
    path: OrbPathStore;
    motion: OrbMotion;
    quality: 'high' | 'low';
    /** Lean towards the mouse on hover. Off for reduced motion. */
    interactive: boolean;
};

/** Hover reaction: how much bigger the orb gets, how far it leans and tilts towards the pointer. */
const HOVER_SCALE = 0.06;
const HOVER_LEAN = 0.12;
const HOVER_TILT = 0.35;
/** The pointer counts as hovering within this many radii of the centre. */
const HOVER_REACH = 1.4;

const SHADOW_OPACITY = 0.22;

/**
 * The orb. Follows the route for the current scroll, rolling as it goes,
 * with the intro's drop offset and squash, and the hover lean applied on
 * top. Built from unit-sized meshes scaled to the measured radius, so
 * resizing never rebuilds geometry.
 */
export default function Orb({ path, motion, quality, interactive }: OrbProps) {
    const body = useRef<Group>(null);
    const shadow = useRef<Mesh>(null);
    const segments = quality === 'high' ? 64 : 32;
    const pointer = useOrbPointer(interactive);

    const textures = useMemo(
        () => ({
            refraction: createRefractionTexture(),
            etch: createEtchTexture(),
            shadow: createShadowTexture(),
        }),
        [],
    );

    useEffect(
        () => () =>
            Object.values(textures).forEach((texture) => texture.dispose()),
        [textures],
    );

    // Per-frame scratch values, kept out of React state.
    const frame = useRef({
        sample: { x: 0, y: 0, r: 0, distance: 0, segment: -1 } as OrbSample,
        orientation: null as { route: OrbRoute; table: OrbOrientation } | null,
        hover: 0,
        lean: new Vector3(),
        tilt: new Quaternion(),
        axis: new Vector3(),
    });

    useFrame(({ size, viewport }, delta) => {
        const group = body.current;
        const floor = shadow.current;
        const state = frame.current;

        if (!group || !floor) {
            return;
        }

        const route = path.route();
        const point = route.sample(window.scrollY, state.sample);
        const visible = motion.visible && path.get().stops.length > 0;
        group.visible = visible;
        floor.visible = visible;

        if (!visible) {
            return;
        }

        // Rebuild the rotation table when the route is re-measured.
        if (state.orientation?.route !== route) {
            state.orientation = { route, table: new OrbOrientation(route) };
        }

        const unitsPerPx = pxToWorld(1, size, viewport.width);
        const radius = point.r;
        // Squash around the contact point, so the bottom stays on the ground.
        const groundOffset = radius * (1 - motion.squash);
        const screenX = point.x - window.scrollX;
        const screenY =
            point.y + motion.offsetY + groundOffset - window.scrollY;

        // Hover: ease towards 1 while the pointer is over (or near) the orb.
        const p = pointer.current;
        const dx = p.x - screenX;
        const dy = p.y - screenY;
        const distance = Math.hypot(dx, dy);
        const near = p.active && distance < radius * HOVER_REACH;
        state.hover = MathUtils.damp(state.hover, near ? 1 : 0, 8, delta);

        const pull =
            distance > 0 ? Math.min(distance / radius, 1) * state.hover : 0;
        const leanX =
            distance > 0 ? (dx / distance) * pull * HOVER_LEAN * radius : 0;
        const leanY =
            distance > 0 ? (dy / distance) * pull * HOVER_LEAN * radius : 0;

        docToWorld(
            point.x + leanX,
            point.y + motion.offsetY + groundOffset + leanY,
            window.scrollY,
            size,
            viewport.width,
            group.position,
        );

        // Roll, then tilt towards the pointer (the same way rolling towards it would).
        state.orientation.table.at(point, group.quaternion);

        if (pull > 0) {
            state.axis.set(dy, dx, 0).normalize();
            group.quaternion.premultiply(
                state.tilt.setFromAxisAngle(state.axis, pull * HOVER_TILT),
            );
        }

        const scale = radius * unitsPerPx * (1 + state.hover * HOVER_SCALE);
        const sideways = scale / Math.sqrt(motion.squash);
        group.scale.set(sideways, scale * motion.squash, sideways);

        // Contact shadow on the ground under the orb. Smaller and fainter while it's in the air.
        const height = Math.max(0, -motion.offsetY);
        const grounded = 1 / (1 + height / (radius * 3));

        docToWorld(
            point.x + radius * 0.12,
            point.y + radius * 0.92,
            window.scrollY,
            size,
            viewport.width,
            floor.position,
        );
        floor.position.z = -0.01;
        floor.scale.set(
            (radius * unitsPerPx * 2.3 * (0.6 + 0.4 * grounded)) /
                Math.sqrt(motion.squash),
            radius * unitsPerPx * 0.6 * (0.6 + 0.4 * grounded),
            1,
        );
        (floor.material as MeshBasicMaterial).opacity =
            SHADOW_OPACITY * grounded;
    });

    return (
        <>
            <mesh ref={shadow} visible={false} renderOrder={-1}>
                <planeGeometry />
                <meshBasicMaterial
                    map={textures.shadow}
                    color="#000000"
                    transparent
                    depthWrite={false}
                />
            </mesh>

            <group ref={body} visible={false}>
                <mesh>
                    <sphereGeometry args={[1, segments, segments / 2]} />
                    <MeshTransmissionMaterial
                        buffer={textures.refraction}
                        samples={quality === 'high' ? 6 : 3}
                        transmission={1}
                        roughness={0.02}
                        thickness={0.9}
                        ior={1.45}
                        chromaticAberration={quality === 'high' ? 0.05 : 0}
                        anisotropicBlur={0.04}
                        distortion={0.12}
                        distortionScale={0.4}
                        temporalDistortion={0}
                        clearcoat={1}
                        clearcoatRoughness={0.1}
                        envMapIntensity={1.2}
                        color="#ffffff"
                    />
                </mesh>
                {/* Etched lines, just outside the glass, so the roll stays visible. */}
                <mesh scale={1.003}>
                    <sphereGeometry args={[1, segments, segments / 2]} />
                    <meshBasicMaterial
                        map={textures.etch}
                        transparent
                        opacity={0.45}
                        depthWrite={false}
                    />
                </mesh>
            </group>
        </>
    );
}
