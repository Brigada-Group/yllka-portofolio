import { Link, usePage } from '@inertiajs/react';
import { useRef } from 'react';
import Emphasis from '@/components/emphasis';
import Languages from '@/components/languages';
import RevealText from '@/components/reveal-text';
import SectionLabel from '@/components/section-label';
import { usePrefersReducedMotion } from '@/hooks/use-media-query';
import { gsap, useGSAP } from '@/lib/gsap';
import { about } from '@/routes';

/**
 * (02) About: the bio as one large statement whose words light up from
 * muted to full white as it scrolls through the viewport. The orb lands as
 * the full stop after the heading.
 */
export default function AboutStatement() {
    const { site } = usePage().props;
    const statement = useRef<HTMLParagraphElement>(null);
    const reducedMotion = usePrefersReducedMotion();
    const words = site.bio.split(/\s+/).filter(Boolean);

    useGSAP(
        () => {
            if (reducedMotion || !statement.current) {
                return;
            }

            gsap.fromTo(
                statement.current.querySelectorAll('[data-word]'),
                { color: 'var(--color-muted)', opacity: 0.35 },
                {
                    color: 'var(--color-foreground)',
                    opacity: 1,
                    ease: 'none',
                    stagger: 0.1,
                    scrollTrigger: {
                        trigger: statement.current,
                        start: 'top 80%',
                        end: 'bottom 55%',
                        scrub: true,
                    },
                },
            );
        },
        {
            dependencies: [reducedMotion, site.bio],
            scope: statement,
            revertOnUpdate: true,
        },
    );

    return (
        <section
            id="about"
            aria-labelledby="about-title"
            className="py-28 md:py-44"
        >
            <div className="mx-auto max-w-[1600px] px-4 md:px-8">
                <div className="grid grid-cols-12 gap-x-6">
                    <div className="col-span-12 md:col-span-10 md:col-start-3">
                        <SectionLabel index={2}>About</SectionLabel>
                        {/* The orb stop: it lands as the full stop after the heading. */}
                        <div data-orb-stop="about">
                            <RevealText as="h2" className="mt-4 text-display">
                                <span id="about-title">
                                    About <Emphasis text="*me*" />
                                    <span
                                        data-orb-slot
                                        aria-hidden="true"
                                        className="ml-[0.05em] inline-block size-[0.16em]"
                                    />
                                </span>
                            </RevealText>
                        </div>
                    </div>

                    <div className="col-span-12 mt-10 md:col-span-10 md:col-start-3 md:mt-14">
                        <p ref={statement} className="text-statement">
                            {words.map((word, index) => (
                                <span key={index} data-word>
                                    {word}{' '}
                                </span>
                            ))}
                        </p>

                        <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 font-mono text-label uppercase">
                            <Link href={about()} className="group">
                                More about me{' '}
                                <span className="inline-block transition-transform group-hover:translate-x-1">
                                    →
                                </span>
                            </Link>
                            {site.resume_url && (
                                <a
                                    href={site.resume_url}
                                    download
                                    className="text-muted hover:text-foreground"
                                >
                                    Résumé (PDF)
                                </a>
                            )}
                        </div>

                        <Languages className="mt-12" />
                    </div>
                </div>
            </div>
        </section>
    );
}
