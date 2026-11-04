import { useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import { orbHero } from '@/components/orb/hero-play';
import { useMediaQuery } from '@/hooks/use-media-query';
import { gsap } from '@/lib/gsap';

/** Throwing: gravity (px/s²), how much speed a bounce keeps, rolling friction (per second). */
const GRAVITY = 2600;
const BOUNCE = 0.5;
const WALL_BOUNCE = 0.6;
const ROLL_FRICTION = 1.8;
/** Fastest throw, px/s. */
const MAX_THROW = 4000;
/** After a throw, the orb heads back onto the ı this many seconds later. */
const RETURN_DELAY = 1.5;
const RETURN_DURATION = 0.9;
/** Peak height (px) of the arc it returns along. */
const RETURN_ARC = 90;
/** Keep clear of the window edges, like the orb's own clamp. */
const EDGE = 24;
/** How far (px) below the hero the glow takes to fade out as the orb leaves. */
const GLOW_FADE = 220;
/** How strongly the glow tints the nearest letters, 0 to 1. */
const LETTER_LIGHT = 0.4;

const HINT_KEY = 'orb-hint-dismissed';

type Mode = 'idle' | 'drag' | 'thrown' | 'return';

function hintDismissed(): boolean {
    try {
        return window.sessionStorage.getItem(HINT_KEY) === '1';
    } catch {
        return false;
    }
}

function dismissHint() {
    try {
        window.sessionStorage.setItem(HINT_KEY, '1');
    } catch {
        // Storage can be unavailable (private mode). The hint just comes back next load.
    }
}

/**
 * The hero's layer around the orb: a soft violet glow behind it that also
 * lights the nearest letters of the name, and (with a mouse) a handle to
 * hop it on hover, drag it, and throw it. A thrown orb falls, bounces off the
 * bottom of the hero, rolls, and goes back onto the ı.
 *
 * Decorative only: hidden from assistive tech and never focusable.
 */
export default function HeroOrb({
    hero,
    name,
    reducedMotion,
}: {
    hero: RefObject<HTMLElement | null>;
    name: RefObject<HTMLElement | null>;
    reducedMotion: boolean;
}) {
    const glow = useRef<HTMLDivElement>(null);
    const handle = useRef<HTMLDivElement>(null);
    const hint = useRef<HTMLSpanElement>(null);
    const finePointer = useMediaQuery('(hover: hover) and (pointer: fine)');
    const playable = finePointer && !reducedMotion;

    // Shared between the ticker and the pointer handlers.
    const state = useRef({
        mode: 'idle' as Mode,
        vx: 0,
        vy: 0,
        grab: { x: 0, y: 0 },
        samples: [] as { t: number; x: number; y: number }[],
        hop: null as gsap.core.Timeline | null,
        back: null as gsap.core.Tween | null,
        wait: null as gsap.core.Tween | null,
        hint: false,
        scrollY: 0,
    });

    // A thrown orb falls here, before the orb is drawn; glow, handle and hint
    // follow the orb right after it is drawn.
    useEffect(() => {
        const section = hero.current;
        const letters = name.current;
        const s = state.current;
        s.hint = playable && !hintDismissed();

        if (!section) {
            return;
        }

        const bounds = () => {
            const box = section.getBoundingClientRect();
            const top = box.top + window.scrollY;

            return {
                top,
                bottom: top + section.offsetHeight,
                left: box.left + window.scrollX,
            };
        };

        const fall = (_time: number, deltaMs: number) => {
            const dt = Math.min(deltaMs / 1000, 0.05);
            const play = orbHero.play;

            if (play && s.mode === 'thrown') {
                const { bottom } = bounds();
                const r = orbHero.r;
                const floor = bottom - r;
                const minX = EDGE + r;
                const maxX = window.innerWidth - EDGE - r;
                const onFloor = play.y >= floor - 0.5 && s.vy === 0;

                if (!onFloor) {
                    s.vy += GRAVITY * dt;
                }

                play.x += s.vx * dt;
                play.y += s.vy * dt;

                if (play.y > floor) {
                    play.y = floor;
                    s.vy = Math.abs(s.vy) < 120 ? 0 : -s.vy * BOUNCE;
                }

                if (play.y < r) {
                    play.y = r;
                    s.vy = Math.abs(s.vy) * BOUNCE;
                }

                if (play.x < minX || play.x > maxX) {
                    play.x = Math.min(Math.max(play.x, minX), maxX);
                    s.vx = -s.vx * WALL_BOUNCE;
                }

                if (onFloor) {
                    s.vx *= Math.exp(-ROLL_FRICTION * dt);
                }
            }
        };

        const follow = () => {
            const { top, bottom, left } = bounds();
            const play = orbHero.play;
            const x = orbHero.x - left;
            const y = orbHero.y - top;
            const r = orbHero.r;
            const inside = orbHero.drawn
                ? Math.min(Math.max((bottom - orbHero.y) / GLOW_FADE, 0), 1)
                : 0;

            if (glow.current) {
                const size = glow.current.offsetWidth;
                glow.current.style.transform = `translate3d(${x - size / 2}px, ${y - size / 2}px, 0)`;
                glow.current.style.opacity = String(inside);
            }

            if (letters) {
                const own = letters.getBoundingClientRect();
                letters.style.setProperty(
                    '--glow-x',
                    `${orbHero.x - window.scrollX - own.left}px`,
                );
                letters.style.setProperty(
                    '--glow-y',
                    `${orbHero.y - window.scrollY - own.top}px`,
                );
                letters.style.setProperty(
                    '--glow-o',
                    String(inside * LETTER_LIGHT),
                );
            }

            const holdable = orbHero.drawn && (orbHero.resting || !!play);

            if (handle.current) {
                const size = Math.max(r * 2.6, 36);
                handle.current.style.display = holdable ? '' : 'none';
                handle.current.style.width = `${size}px`;
                handle.current.style.height = `${size}px`;
                handle.current.style.transform = `translate3d(${x - size / 2}px, ${y - size / 2}px, 0)`;
            }

            if (hint.current) {
                hint.current.style.opacity =
                    s.hint && orbHero.resting ? '1' : '0';
                hint.current.style.transform = `translate3d(${x + r + 14}px, ${y - r - 22}px, 0)`;
            }
        };

        gsap.ticker.add(fall);
        orbHero.listeners.add(follow);

        return () => {
            gsap.ticker.remove(fall);
            orbHero.listeners.delete(follow);
        };
    }, [hero, name, playable]);

    // Scrolling away while the orb is out: send it straight back to its route.
    useEffect(() => {
        if (!playable) {
            return;
        }

        const s = state.current;
        s.scrollY = window.scrollY;
        const onScroll = () => {
            if (
                orbHero.play &&
                s.mode === 'thrown' &&
                Math.abs(window.scrollY - s.scrollY) > 4
            ) {
                goBack();
            }
        };
        window.addEventListener('scroll', onScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', onScroll);
            s.hop?.kill();
            s.back?.kill();
            s.wait?.kill();
            orbHero.play = null;
            orbHero.hop.y = 0;
            orbHero.hop.squash = 1;
        };
        // goBack only touches refs and the shared store.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playable]);

    const land = () => {
        gsap.fromTo(
            orbHero.hop,
            { squash: 0.85 },
            { squash: 1, duration: 0.45, ease: 'elastic.out(1, 0.5)' },
        );
    };

    /** Arc back onto the route (the ı, or wherever the scroll has taken it). */
    function goBack() {
        const s = state.current;
        const play = orbHero.play;

        if (!play) {
            return;
        }

        s.wait?.kill();
        s.back?.kill();
        s.mode = 'return';
        s.back = gsap.to(play, {
            blend: 0,
            duration: RETURN_DURATION,
            ease: 'power2.inOut',
            onUpdate: () => {
                play.lift = Math.sin(Math.PI * (1 - play.blend)) * RETURN_ARC;
            },
            onComplete: () => {
                orbHero.play = null;
                s.mode = 'idle';
                land();
            },
        });
    }

    const onPointerEnter = () => {
        const s = state.current;

        if (!orbHero.resting || s.hop?.isActive()) {
            return;
        }

        // A small hop: up ~12px, down, and squash on landing.
        s.hop = gsap
            .timeline()
            .to(orbHero.hop, { y: -12, duration: 0.2, ease: 'power2.out' })
            .to(orbHero.hop, { y: 0, duration: 0.2, ease: 'power2.in' })
            .add(land);
    };

    const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (event.button !== 0) {
            return;
        }

        const s = state.current;
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);

        s.hop?.kill();
        s.back?.kill();
        s.wait?.kill();
        orbHero.hop.y = 0;
        orbHero.hop.squash = 1;

        // Pick it up where it is drawn, even mid-throw or mid-return.
        orbHero.play = { x: orbHero.x, y: orbHero.y, blend: 1, lift: 0 };
        s.mode = 'drag';
        s.grab = {
            x: event.pageX - orbHero.x,
            y: event.pageY - orbHero.y,
        };
        s.samples = [{ t: event.timeStamp, x: orbHero.x, y: orbHero.y }];

        if (s.hint) {
            s.hint = false;
            dismissHint();
        }
    };

    const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
        const s = state.current;
        const play = orbHero.play;

        if (s.mode !== 'drag' || !play) {
            return;
        }

        const r = orbHero.r;
        play.x = Math.min(
            Math.max(event.pageX - s.grab.x, EDGE + r),
            window.innerWidth - EDGE - r,
        );
        play.y = Math.max(event.pageY - s.grab.y, r);
        s.samples.push({ t: event.timeStamp, x: play.x, y: play.y });
        s.samples = s.samples.filter(
            (sample) => event.timeStamp - sample.t < 100,
        );
    };

    const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
        const s = state.current;

        if (s.mode !== 'drag') {
            return;
        }

        // Throw with the speed of the last ~100ms of dragging.
        const first = s.samples[0];
        const last = s.samples[s.samples.length - 1];
        const seconds = first && last ? (last.t - first.t) / 1000 : 0;
        const clampThrow = (v: number) =>
            Math.min(Math.max(v, -MAX_THROW), MAX_THROW);

        s.vx = seconds > 0.01 ? clampThrow((last.x - first.x) / seconds) : 0;
        s.vy = seconds > 0.01 ? clampThrow((last.y - first.y) / seconds) : 0;
        s.mode = 'thrown';
        s.scrollY = window.scrollY;
        s.wait = gsap.delayedCall(RETURN_DELAY, goBack);
        event.currentTarget.releasePointerCapture(event.pointerId);
    };

    return (
        <>
            {/* Behind the text. */}
            <div
                ref={glow}
                aria-hidden="true"
                className="hero-glow pointer-events-none absolute top-0 left-0 opacity-0"
            />

            {playable && (
                <>
                    <div
                        ref={handle}
                        aria-hidden="true"
                        className="absolute top-0 left-0 z-20 cursor-grab touch-none rounded-full select-none active:cursor-grabbing"
                        style={{ display: 'none' }}
                        onPointerEnter={onPointerEnter}
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onPointerCancel={onPointerUp}
                    />
                    <span
                        ref={hint}
                        aria-hidden="true"
                        className="pointer-events-none absolute top-0 left-0 z-20 hidden font-mono text-label whitespace-nowrap text-muted uppercase opacity-0 transition-opacity duration-700 md:block"
                    >
                        (drag me)
                    </span>
                </>
            )}
        </>
    );
}
