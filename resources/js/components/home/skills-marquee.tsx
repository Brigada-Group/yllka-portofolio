import { useEffect, useRef, useState } from 'react';
import SectionLabel from '@/components/section-label';
import RevealText from '@/components/reveal-text';
import Emphasis from '@/components/emphasis';
import { useReducedMotion } from '@/lib/motion';
import { gsap, useGSAP } from '@/lib/gsap';
import { useLenis } from '@/lib/smooth-scroll';
import type { Skill } from '@/types';

/** Seconds for one full loop of a row at rest. */
const LOOP_SECONDS = 40;
/** How much scroll speed (px per frame from Lenis) speeds the rows up, and the cap. */
const VELOCITY_BOOST = 0.12;
const MAX_BOOST = 5;

/** Splits skills into `count` rows of similar length. */
function rows(skills: Skill[], count: number): Skill[][] {
    const result: Skill[][] = Array.from({ length: count }, () => []);
    skills.forEach((skill, index) => result[index % count].push(skill));

    return result.filter((row) => row.length > 0);
}

/**
 * (03) Skills: rows of skill names at huge size, alternating sans and italic
 * serif, looping in opposite directions. Scrolling speeds them up (and
 * flips them with the scroll direction); hovering a row pauses it.
 *
 * Moving for more than five seconds, so (WCAG 2.2.2) a button pauses and
 * plays them, and they also pause while keyboard focus is in the section.
 * Screen readers get a plain list; the rows are decoration. Still with
 * reduced motion.
 */
export default function SkillsMarquee({ skills }: { skills: Skill[] }) {
    const container = useRef<HTMLDivElement>(null);
    const reducedMotion = useReducedMotion();
    const lenis = useLenis();
    const [paused, setPaused] = useState(false);
    const [focusInside, setFocusInside] = useState(false);
    // Read by the ticker; eased so pausing and playing don't jerk.
    const running = useRef({ target: 1, value: 1 });

    useEffect(() => {
        running.current.target = paused || focusInside ? 0 : 1;
    }, [paused, focusInside]);

    useGSAP(
        () => {
            if (reducedMotion || !container.current) {
                return;
            }

            const tracks = Array.from(
                container.current.querySelectorAll<HTMLElement>(
                    '[data-marquee]',
                ),
            );
            const loops = tracks.map((track, index) =>
                gsap.fromTo(
                    track,
                    { xPercent: index % 2 === 0 ? 0 : -50 },
                    {
                        xPercent: index % 2 === 0 ? -50 : 0,
                        duration: LOOP_SECONDS,
                        ease: 'none',
                        repeat: -1,
                    },
                ),
            );
            const hover = tracks.map(() => ({ value: 1 }));
            let direction = 1;

            const cleanups = tracks.map((track, index) => {
                const row = track.parentElement!;
                const enter = () =>
                    gsap.to(hover[index], {
                        value: 0,
                        duration: 0.6,
                        ease: 'power2.out',
                    });
                const leave = () =>
                    gsap.to(hover[index], {
                        value: 1,
                        duration: 0.6,
                        ease: 'power2.out',
                    });
                row.addEventListener('pointerenter', enter);
                row.addEventListener('pointerleave', leave);

                return () => {
                    row.removeEventListener('pointerenter', enter);
                    row.removeEventListener('pointerleave', leave);
                };
            });

            const tick = (_time: number, deltaMs: number) => {
                const run = running.current;
                run.value +=
                    (run.target - run.value) *
                    (1 - Math.exp(-8 * (deltaMs / 1000)));
                const velocity = lenis?.velocity ?? 0;

                if (Math.abs(velocity) > 0.5) {
                    direction = Math.sign(velocity);
                }

                const boost =
                    1 +
                    Math.min(Math.abs(velocity) * VELOCITY_BOOST, MAX_BOOST);
                loops.forEach((loop, index) =>
                    loop.timeScale(
                        direction * boost * hover[index].value * run.value,
                    ),
                );
            };
            gsap.ticker.add(tick);

            return () => {
                gsap.ticker.remove(tick);
                cleanups.forEach((cleanup) => cleanup());
            };
        },
        {
            dependencies: [reducedMotion, lenis, skills],
            scope: container,
            revertOnUpdate: true,
        },
    );

    return (
        <section
            id="skills"
            aria-labelledby="skills-title"
            className="py-24 md:py-40"
            onFocus={() => setFocusInside(true)}
            onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                    setFocusInside(false);
                }
            }}
        >
            <div className="mx-auto max-w-[1600px] px-4 md:px-8">
                <div className="grid grid-cols-12 gap-x-6">
                    <div className="col-span-12 md:col-span-10 md:col-start-3">
                        <SectionLabel index={3}>Skills</SectionLabel>
                        {/*
                          The orb stop: it lands as the full stop after "for" and stays
                          while the marquees pass, then rolls off and falls on.
                        */}
                        <div data-orb-stop="skills">
                            <RevealText as="h2" className="mt-4 text-display">
                                <span id="skills-title">
                                    Tools I <Emphasis text="*reach*" /> for
                                    <span
                                        data-orb-slot
                                        aria-hidden="true"
                                        className="ml-[0.05em] inline-block size-[0.16em]"
                                    />
                                </span>
                            </RevealText>
                        </div>
                    </div>
                </div>
            </div>

            {!reducedMotion && (
                <div className="mx-auto mt-10 flex max-w-[1600px] justify-end px-4 md:px-8">
                    <button
                        type="button"
                        onClick={() => setPaused((value) => !value)}
                        className="inline-flex min-h-6 items-center gap-2 font-mono text-[12px] tracking-[0.06em] text-muted uppercase transition-colors hover:text-foreground"
                    >
                        <span aria-hidden="true">{paused ? '▶' : '❚❚'}</span>
                        {paused ? 'Play' : 'Pause'}
                        <span className="sr-only"> the moving skills</span>
                    </button>
                </div>
            )}

            {/* Screen readers get the plain list; the moving rows are decoration. */}
            <ul className="sr-only">
                {skills.map((skill) => (
                    <li key={skill.id}>{skill.name}</li>
                ))}
            </ul>

            {/* Clipped to the content width, leaving the page margins clear for the orb to pass. */}
            <div
                ref={container}
                aria-hidden="true"
                className="mx-auto mt-6 max-w-[1600px] px-4 md:mt-8 md:px-8"
            >
                <div className="space-y-2 overflow-hidden">
                    {rows(skills, 3).map((row, rowIndex) => (
                        <div
                            key={rowIndex}
                            className="overflow-hidden whitespace-nowrap"
                        >
                            {/* Two copies, so a -50% shift loops seamlessly. */}
                            <div data-marquee className="inline-flex w-max">
                                {[0, 1].map((copy) => (
                                    <span key={copy} className="inline-flex">
                                        {row.map((skill, index) => (
                                            <span
                                                key={skill.id}
                                                className="inline-flex items-center text-marquee"
                                            >
                                                <span
                                                    className={
                                                        (index + rowIndex) %
                                                            2 ===
                                                        1
                                                            ? 'font-display italic'
                                                            : ''
                                                    }
                                                >
                                                    {skill.name}
                                                </span>
                                                <span className="mx-[0.35em] inline-block size-[0.14em] rounded-full bg-accent" />
                                            </span>
                                        ))}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
