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

/** Stretch along the direction of travel: up to this much longer at high speed. */
const MAX_STRETCH = 0.14;
/** Speed (px/s along the route) at which the stretch is about two-thirds of the max. */
const STRETCH_SPEED = 1500;
/** Lean into turns: radians of tilt per radian/second of turning, capped. */
const TURN_LEAN = 0.06;
const MAX_LEAN = 0.2;

/** Idle drift: after this many seconds without scrolling, ease towards the mouse... */
const IDLE_DELAY = 0.6;
/** ...by this share of the distance to it, but at most this many px. */
const DRIFT_PULL = 0.1;
const MAX_DRIFT = 20;

/** The shortest signed angle from a to b. */
const angleBetween = (a: number, b: number) =>
    Math.atan2(Math.sin(b - a), Math.cos(b - a));

/**
 * The orb. Follows the route for the current scroll, rolling as it goes,
 * with the intro's drop offset and squash, and the hover lean applied on
 * top. Built from unit-sized meshes scaled to the measured radius, so
 * resizing never rebuilds geometry.
 */
export default function Orb({ path, motion, quality, interactive }: OrbProps) {
    const body = useRef<Group>(null);
    const stretch = useRef<Group>(null);
    const unstretch = useRef<Group>(null);
    const roll = useRef<Group>(null);
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
        tilt: new Quaternion(),
        axis: new Vector3(),
        // Motion along the route, smoothed: velocity (px/s), heading, turning rate.
        previous: null as { x: number; y: number } | null,
        vx: 0,
        vy: 0,
        heading: 0,
        turning: 0,
        stretch: 1,
        idle: 0,
        drift: { x: 0, y: 0 },
    });

    useFrame(({ size, viewport }, delta) => {
        const group = body.current;
        const floor = shadow.current;
        const state = frame.current;

        if (
            !group ||
            !floor ||
            !stretch.current ||
            !unstretch.current ||
            !roll.current
        ) {
            return;
        }

        const route = path.route();
        // The lagged scroll, so the orb catches up with the page instead of being glued to it.
        const point = route.sample(path.scroll(), state.sample);
        const visible = motion.visible && path.get().stops.length > 0;
        group.visible = visible;
        floor.visible = visible;

        if (!visible || delta <= 0) {
            return;
        }

        // Rebuild the rotation table when the route is re-measured.
        if (state.orientation?.route !== route) {
            state.orientation = { route, table: new OrbOrientation(route) };
        }

        // Velocity along the route, relative to the page. Ignore jumps (resize, re-measure).
        if (state.previous) {
            const vx = (point.x - state.previous.x) / delta;
            const vy = (point.y - state.previous.y) / delta;

            if (Math.hypot(vx, vy) < 20000) {
                state.vx = MathUtils.damp(state.vx, vx, 12, delta);
                state.vy = MathUtils.damp(state.vy, vy, 12, delta);
            }
        }

        state.previous = { x: point.x, y: point.y };
        const speed = Math.hypot(state.vx, state.vy);

        // Heading in world space (y up). Only meaningful while moving.
        if (speed > 30) {
            const step =
                angleBetween(state.heading, Math.atan2(-state.vy, state.vx)) *
                (1 - Math.exp(-10 * delta));
            state.heading += step;
            state.turning = MathUtils.damp(
                state.turning,
                step / delta,
                6,
                delta,
            );
        } else {
            state.turning = MathUtils.damp(state.turning, 0, 6, delta);
        }

        state.stretch = MathUtils.damp(
            state.stretch,
            1 + MAX_STRETCH * (1 - Math.exp(-speed / STRETCH_SPEED)),
            10,
            delta,
        );
        const lean = MathUtils.clamp(
            state.turning * TURN_LEAN,
            -MAX_LEAN,
            MAX_LEAN,
        );

        const unitsPerPx = pxToWorld(1, size, viewport.width);
        const radius = point.r;
        // Squash around the contact point, so the bottom stays on the ground.
        const groundOffset = radius * (1 - motion.squash);
        const screenX = point.x - window.scrollX;
        const screenY =
            point.y + motion.offsetY + groundOffset - window.scrollY;
        const p = pointer.current;

        // Idle drift: once scrolling has settled, ease a little towards the mouse.
        const settled =
            Math.abs(window.scrollY - path.scroll()) < 0.5 &&
            speed < 5 &&
            motion.offsetY === 0;
        state.idle = settled ? state.idle + delta : 0;
        let driftX = 0;
        let driftY = 0;

        if (p.active && state.idle > IDLE_DELAY) {
            driftX = (p.x - screenX) * DRIFT_PULL;
            driftY = (p.y - screenY) * DRIFT_PULL;
            const length = Math.hypot(driftX, driftY);

            if (length > MAX_DRIFT) {
                driftX *= MAX_DRIFT / length;
                driftY *= MAX_DRIFT / length;
            }
        }

        state.drift.x = MathUtils.damp(state.drift.x, driftX, 1.5, delta);
        state.drift.y = MathUtils.damp(state.drift.y, driftY, 1.5, delta);

        // Hover: ease towards 1 while the pointer is over (or near) the orb.
        const dx = p.x - (screenX + state.drift.x);
        const dy = p.y - (screenY + state.drift.y);
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
            point.x + state.drift.x + leanX,
            point.y + state.drift.y + motion.offsetY + groundOffset + leanY,
            window.scrollY,
            size,
            viewport.width,
            group.position,
        );

        // Size and the intro's vertical squash.
        const scale = radius * unitsPerPx * (1 + state.hover * HOVER_SCALE);
        const sideways = scale / Math.sqrt(motion.squash);
        group.scale.set(sideways, scale * motion.squash, sideways);

        // Stretch along the heading (leaning into turns), without turning the orb itself.
        const axis = state.heading + lean;
        stretch.current.rotation.z = axis;
        stretch.current.scale.set(
            state.stretch,
            1 / Math.sqrt(state.stretch),
            1 / Math.sqrt(state.stretch),
        );
        unstretch.current.rotation.z = -axis;

        // Roll, then tilt towards the pointer (the same way rolling towards it would).
        state.orientation.table.at(point, roll.current.quaternion);

        if (pull > 0) {
            state.axis.set(dy, dx, 0).normalize();
            roll.current.quaternion.premultiply(
                state.tilt.setFromAxisAngle(state.axis, pull * HOVER_TILT),
            );
        }

        // Contact shadow on the ground under the orb. Smaller and fainter while it's in the air.
        const height = Math.max(0, -motion.offsetY);
        const grounded = 1 / (1 + height / (radius * 3));

        docToWorld(
            point.x + state.drift.x + radius * 0.12,
            point.y + state.drift.y + radius * 0.92,
            window.scrollY,
            size,
            viewport.width,
            floor.position,
        );
        floor.position.z = -0.01;
        floor.scale.set(
            (radius *
                unitsPerPx *
                2.3 *
                (0.6 + 0.4 * grounded) *
                state.stretch) /
                Math.sqrt(motion.squash),
            radius * unitsPerPx * 0.6 * (0.6 + 0.4 * grounded),
            1,
        );
        (floor.material as MeshBasicMaterial).opacity =
            SHADOW_OPACITY * grounded;
    });

    return (
        <>
            {/* Never frustum-culled, so the parked orb still renders (and compiles) before the intro. */}
            <mesh
                ref={shadow}
                visible={false}
                renderOrder={-1}
                frustumCulled={false}
            >
                <planeGeometry />
                <meshBasicMaterial
                    map={textures.shadow}
                    color="#000000"
                    transparent
                    depthWrite={false}
                />
            </mesh>

            {/* Position and intro squash > stretch along heading > undo its turn > roll. */}
            <group ref={body} visible={false}>
                <group ref={stretch}>
                    <group ref={unstretch}>
                        <group ref={roll}>
                            <mesh frustumCulled={false}>
                                <sphereGeometry
                                    args={[1, segments, segments / 2]}
                                />
                                <MeshTransmissionMaterial
                                    buffer={textures.refraction}
                                    samples={quality === 'high' ? 6 : 3}
                                    transmission={1}
                                    roughness={0.02}
                                    thickness={0.9}
                                    ior={1.45}
                                    chromaticAberration={
                                        quality === 'high' ? 0.05 : 0
                                    }
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
                            <mesh scale={1.003} frustumCulled={false}>
                                <sphereGeometry
                                    args={[1, segments, segments / 2]}
                                />
                                <meshBasicMaterial
                                    map={textures.etch}
                                    transparent
                                    opacity={0.45}
                                    depthWrite={false}
                                />
                            </mesh>
                        </group>
                    </group>
                </group>
            </group>
        </>
    );
}
