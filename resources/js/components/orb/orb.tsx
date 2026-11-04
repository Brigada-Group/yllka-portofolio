import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { MathUtils, Quaternion, Vector3 } from 'three';
import type { Group, Mesh, MeshBasicMaterial } from 'three';
import type { Theme } from '@/lib/theme';
import {
    createBloomMaterial,
    HALO,
    setBloomTheme,
    setBreath,
} from './bloom-material';
import { docToWorld, pxToWorld } from './coordinates';
import { orbHero } from './hero-play';
import { VIEWPORT_MARGIN } from './route';
import type { OrbMotion } from './motion';
import { OrbOrientation } from './orientation';
import { createHaloTexture, createShadowTexture } from './textures';
import type { OrbPathStore, OrbRoute, OrbSample } from './types';
import { useOrbPointer } from './use-orb-pointer';

type OrbProps = {
    path: OrbPathStore;
    motion: OrbMotion;
    quality: 'high' | 'low';
    /** Hover, breathing and swirl. Off for reduced motion. */
    interactive: boolean;
    theme: Theme;
};

/** Hover reaction: how much bigger the orb gets, how far it leans and tilts towards the pointer. */
const HOVER_SCALE = 0.06;
const HOVER_LEAN = 0.12;
const HOVER_TILT = 0.35;
/** The pointer counts as hovering within this many radii of the centre. */
const HOVER_REACH = 1.4;

/** The contact shadow, a little stronger on the light theme so the orb sits on the page. */
const SHADOW_OPACITY = { dark: 0.18, light: 0.32 };

/** Longest time step a frame may take, in seconds: the first frame, or a return to a background tab, otherwise jumps. */
const MAX_STEP = 0.1;

/**
 * The visible spin follows the rolled distance with a little damping, so it
 * eases to a stop when the scroll stops, and never trails by more than half
 * a turn (so it doesn't keep spinning to catch up after a fast scroll).
 */
const SPIN_DAMPING = 12;

/** How quickly the orb settles onto (or lets go of) a pinned track's real height, per second. */
const ATTACH_SPEED = 10;
const MAX_SPIN_LAG_TURNS = 0.5;

/** Breathing: one slow breath every 6s at rest, a quick one every 2s while busy (moving or hovered). */
const BREATH_REST = 6;
const BREATH_BUSY = 2;
/** The blobs swirl once every 8s while the orb travels, on top of rolling. Parked, they hold still. */
const SWIRL_MOVING = 8;
/** Parked, the orb only breathes: its scale swells by this much with each breath. */
const BREATH_SCALE = 0.02;
/** Speed (px/s along the route) that counts as fully busy. */
const BUSY_SPEED = 800;
/** The busy glow pulses every 1.6s. */
const GLOW_PERIOD = 1.6;
/** Halo: slightly larger than the orb and a little low (colour and opacity per theme). */
const HALO_SIZE = 1.3;
const HALO_DROP = 0.08;

/** Stretch along the direction of travel: up to this much longer at high speed. */
const MAX_STRETCH = 0.14;
/** Speed (px/s along the route) at which the stretch is about two-thirds of the max. */
const STRETCH_SPEED = 1500;
/** Lean into turns: radians of tilt per radian/second of turning, capped. */
const TURN_LEAN = 0.06;
const MAX_LEAN = 0.2;

/** The shortest signed angle from a to b. */
const angleBetween = (a: number, b: number) =>
    Math.atan2(Math.sin(b - a), Math.cos(b - a));

/**
 * The orb. Follows the route for the current scroll, rolling as it goes,
 * with the intro's drop offset and squash, and the hover lean applied on
 * top. Built from unit-sized meshes scaled to the measured radius, so
 * resizing never rebuilds geometry.
 */
export default function Orb({
    path,
    motion,
    quality,
    interactive,
    theme,
}: OrbProps) {
    const body = useRef<Group>(null);
    const stretch = useRef<Group>(null);
    const unstretch = useRef<Group>(null);
    const roll = useRef<Group>(null);
    const shadow = useRef<Mesh>(null);
    const segments = quality === 'high' ? 64 : 32;
    const pointer = useOrbPointer(interactive);

    const textures = useMemo(
        () => ({ halo: createHaloTexture(), shadow: createShadowTexture() }),
        [],
    );
    const bloom = useMemo(createBloomMaterial, []);
    const halo = useRef<MeshBasicMaterial>(null);

    // Follow the theme live, without rebuilding the scene.
    useEffect(() => {
        setBloomTheme(bloom, theme === 'light');

        if (halo.current) {
            halo.current.color.set(HALO[theme].color);
            halo.current.opacity = HALO[theme].opacity;
        }
    }, [bloom, theme]);

    useEffect(
        () => () => {
            Object.values(textures).forEach((texture) => texture.dispose());
            bloom.dispose();
        },
        [textures, bloom],
    );

    // Per-frame scratch values, kept out of React state.
    const frame = useRef({
        sample: {
            x: 0,
            y: 0,
            r: 0,
            distance: 0,
            segment: -1,
            frame: null,
            progress: 0,
            squash: 1,
        } as OrbSample,
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
        // Breathing and swirl.
        busy: 0,
        breath: 0,
        swirl: 0,
        glow: 0,
        spin: new Quaternion(),
        view: new Vector3(0, 0, 1),
        // Where rolling and swirl put the orb, and what is shown (rate-limited towards it).
        target: new Quaternion(),
        // The rolled distance the visible spin is showing (damped towards the route's).
        rolled: null as number | null,
        laneTurn: new Quaternion(),
        // How firmly the orb is attached to a pinned track's real height, 0 to 1.
        attach: 0,
        laneAxis: new Vector3(0, 1, 0),
        // Rolling while the hero holds the orb (dragged, thrown, returning).
        playTurn: new Quaternion(),
        playStep: new Quaternion(),
        playAxis: new Vector3(),
        identity: new Quaternion(),
        playPrevious: null as { x: number; y: number } | null,
    });

    useFrame(({ size, viewport }, frameDelta) => {
        const delta = Math.min(frameDelta, MAX_STEP);
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
        // Swiping a lane's row on small screens rolls the orb along its track.
        const laneShift = path.laneShift(point);
        point.x += laneShift;

        // On and near a pinned track, follow the track's real height on screen
        // (frozen while pinned), not the lagged scroll, so the orb never bobs
        // off it. Attachment eases in and out over time, so when the lag has
        // opened a gap (a fast scroll into or out of the pin) the orb glides
        // onto the track instead of jumping.
        const pinFrame = point.frame;
        let towardsTrack = 0;
        let attach = 0;

        if (pinFrame) {
            const moved = MathUtils.clamp(
                window.scrollY - pinFrame.start,
                0,
                pinFrame.span,
            );

            if (pinFrame.pinned) {
                towardsTrack = pinFrame.y + moved - point.y;
                attach = 1;
            } else {
                towardsTrack = moved - pinFrame.frame;
                attach = MathUtils.clamp(
                    1 - Math.abs(point.y - pinFrame.y) / (point.r * 2),
                    0,
                    1,
                );
            }
        }

        state.attach = MathUtils.damp(
            state.attach,
            attach,
            ATTACH_SPEED,
            delta,
        );

        if (Math.abs(state.attach - attach) < 0.002) {
            state.attach = attach;
        }

        point.y += state.attach * towardsTrack;

        // In the hero, the orb can be dragged and thrown (see hero-play.ts).
        const play = orbHero.play;
        // On the ı: the route starts there, so it hasn't rolled from it (allowing
        // for the last fraction of a pixel of the catch-up lag).
        const resting = point.distance < 0.5 && motion.offsetY === 0;

        if (play) {
            point.x = MathUtils.lerp(point.x, play.x, play.blend);
            point.y = MathUtils.lerp(point.y, play.y, play.blend) - play.lift;
        }

        const visible = motion.visible && path.get().stops.length > 0;
        group.visible = visible;
        floor.visible = visible;
        orbHero.drawn = visible;

        if (!visible || delta <= 0) {
            return;
        }

        // Rebuild the rotation table when the route is re-measured.
        if (state.orientation?.route !== route) {
            state.orientation = {
                route,
                table: new OrbOrientation(route, path.get().radius),
            };
        }

        // Velocity along the route: how fast the orb is rolling and which way,
        // from the distance it rolled and the direction of its segment. Unlike
        // its position, this isn't thrown off by pinning or the catch-up lag.
        // Ignore jumps (resize, re-measure), and lane swipes add their own motion.
        const segment = route.segments[point.segment];
        const rolled = point.distance + laneShift;

        if (state.previous && segment) {
            const speedAlong = (rolled - state.previous.x) / delta;

            if (Math.abs(speedAlong) < 20000) {
                const dx = laneShift !== state.previous.y ? 1 : segment.dx;
                const dy = laneShift !== state.previous.y ? 0 : segment.dy;
                state.vx = MathUtils.damp(state.vx, speedAlong * dx, 12, delta);
                state.vy = MathUtils.damp(state.vy, speedAlong * dy, 12, delta);
            }
        } else {
            state.vx = MathUtils.damp(state.vx, 0, 12, delta);
            state.vy = MathUtils.damp(state.vy, 0, 12, delta);
        }

        // Reused as (rolled distance, lane shift) from the last frame.
        state.previous = { x: rolled, y: laneShift };
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
        // The intro's drop and the hover hop lift the orb and squash it.
        const offsetY = motion.offsetY + orbHero.hop.y;
        const liftSquash = motion.squash * orbHero.hop.squash;
        // Squash from the intro drop and from landings, around the contact
        // point so the bottom stays on the ground.
        const squash = liftSquash * point.squash;
        const groundOffset = radius * (1 - squash);
        // Always fully inside the viewport, with a margin.
        point.x = MathUtils.clamp(
            point.x,
            VIEWPORT_MARGIN + radius,
            size.width - VIEWPORT_MARGIN - radius,
        );
        const screenX = point.x - window.scrollX;
        const screenY = point.y + offsetY + groundOffset - window.scrollY;

        orbHero.x = point.x;
        orbHero.y = point.y + offsetY + groundOffset;
        orbHero.r = radius;
        orbHero.resting = resting && !play;
        orbHero.listeners.forEach((listener) => listener());
        const p = pointer.current;

        // Hover: ease towards 1 while the pointer is over (or near) the orb.
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
            point.y + offsetY + groundOffset + leanY,
            window.scrollY,
            size,
            viewport.width,
            group.position,
        );

        // Size and the intro's vertical squash.
        // Breathing: a tiny swell with each breath, so the parked orb feels alive.
        const swell = interactive
            ? (0.5 - 0.5 * Math.cos(state.breath * Math.PI * 2)) * BREATH_SCALE
            : 0;
        const scale =
            radius * unitsPerPx * (1 + state.hover * HOVER_SCALE + swell);
        // Landing squash widens more than volume would (0.85 tall, 1.12 wide).
        const sideways = (scale / Math.sqrt(liftSquash)) * point.squash ** -0.7;
        group.scale.set(sideways, scale * squash, sideways);

        // Stretch along the heading (leaning into turns), without turning the orb itself.
        const axis = state.heading + lean;
        stretch.current.rotation.z = axis;
        stretch.current.scale.set(
            state.stretch,
            1 / Math.sqrt(state.stretch),
            1 / Math.sqrt(state.stretch),
        );
        unstretch.current.rotation.z = -axis;

        // Breathe and swirl, faster while busy (moving or hovered). Still for reduced motion.
        if (interactive) {
            state.busy = MathUtils.damp(
                state.busy,
                Math.max(Math.min(speed / BUSY_SPEED, 1), state.hover),
                3,
                delta,
            );
            state.breath =
                (state.breath +
                    delta /
                        MathUtils.lerp(BREATH_REST, BREATH_BUSY, state.busy)) %
                1;
            // Swirl only while travelling: parked, the orb holds still.
            state.swirl +=
                (delta / SWIRL_MOVING) *
                Math.min(speed / BUSY_SPEED, 1) *
                Math.PI *
                2;
            state.glow = (state.glow + delta / GLOW_PERIOD) % 1;
        }

        setBreath(
            bloom,
            interactive ? state.breath : 0.5,
            state.busy * (0.5 - 0.5 * Math.cos(state.glow * Math.PI * 2)),
        );

        // Roll: ease the shown distance towards the route's, never lagging more than half a turn.
        const maxLag =
            Math.PI *
            Math.max(radius, path.get().radius) *
            MAX_SPIN_LAG_TURNS *
            2;
        const damped =
            state.rolled === null
                ? point.distance
                : MathUtils.damp(
                      state.rolled,
                      point.distance,
                      SPIN_DAMPING,
                      delta,
                  );
        state.rolled = MathUtils.clamp(
            damped,
            point.distance - maxLag,
            point.distance + maxLag,
        );
        state.orientation.table.at(state.rolled, state.target);

        // Swiping a lane on small screens rolls the orb along it, truly (distance / radius).
        if (laneShift !== 0) {
            state.target.premultiply(
                state.laneTurn.setFromAxisAngle(
                    state.laneAxis,
                    laneShift / radius,
                ),
            );
        }

        // Held by the hero: roll with every move (distance / radius), and
        // unwind smoothly once it is back on its route.
        if (play && state.playPrevious) {
            const mx = point.x - state.playPrevious.x;
            const my = point.y - state.playPrevious.y;
            const moved = Math.hypot(mx, my);

            if (moved > 0 && moved < radius * 40) {
                state.playTurn.premultiply(
                    state.playStep.setFromAxisAngle(
                        state.playAxis.set(my / moved, mx / moved, 0),
                        moved / radius,
                    ),
                );
            }
        } else if (!play) {
            state.playTurn.slerp(state.identity, 1 - Math.exp(-6 * delta));
        }

        state.playPrevious = play ? { x: point.x, y: point.y } : null;
        state.target.premultiply(state.playTurn);

        // Then swirl about the view axis.
        state.target.premultiply(
            state.spin.setFromAxisAngle(state.view, state.swirl),
        );
        roll.current.quaternion.copy(state.target);

        // `?orb-debug` (see OrbStage): expose the rotation for inspection.
        if ('__orb' in window && !('__orbRotation' in window)) {
            Object.assign(window, {
                __orbRotation: state.target,
                __orbPoint: point,
            });
        }

        // Then tilt towards the pointer.
        if (pull > 0) {
            state.axis.set(dy, dx, 0).normalize();
            roll.current.quaternion.premultiply(
                state.tilt.setFromAxisAngle(state.axis, pull * HOVER_TILT),
            );
        }

        // Contact shadow on the ground under the orb. Smaller and fainter while it's in the air.
        const height = Math.max(0, -offsetY);
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
            (radius *
                unitsPerPx *
                2.3 *
                (0.6 + 0.4 * grounded) *
                state.stretch) /
                Math.sqrt(liftSquash),
            radius * unitsPerPx * 0.6 * (0.6 + 0.4 * grounded),
            1,
        );
        // No contact shadow while the hero holds the orb: it is off its ledge.
        (floor.material as MeshBasicMaterial).opacity =
            SHADOW_OPACITY[theme] * grounded * (1 - (play?.blend ?? 0));
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
                {/* Soft lavender halo behind the orb. */}
                <mesh
                    position={[0, -HALO_DROP, -1.05]}
                    scale={HALO_SIZE * 2}
                    renderOrder={-1}
                    frustumCulled={false}
                >
                    <planeGeometry />
                    <meshBasicMaterial
                        ref={halo}
                        map={textures.halo}
                        color={HALO[theme].color}
                        transparent
                        opacity={HALO[theme].opacity}
                        depthWrite={false}
                        toneMapped={false}
                    />
                </mesh>
                <group ref={stretch}>
                    <group ref={unstretch}>
                        <group ref={roll}>
                            <mesh frustumCulled={false} material={bloom}>
                                <sphereGeometry
                                    args={[1, segments, segments / 2]}
                                />
                            </mesh>
                        </group>
                    </group>
                </group>
            </group>
        </>
    );
}
