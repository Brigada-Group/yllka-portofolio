import Emphasis from '@/components/emphasis';
import RevealText from '@/components/reveal-text';
import SectionLabel from '@/components/section-label';
import { experienceLines, experiencePeriod } from '@/lib/experience';
import type { Experience } from '@/types';

/** (04) Experience: the orb lands as the full stop after the heading. */
export default function ExperienceTrack({
    experiences,
}: {
    experiences: Experience[];
}) {
    return (
        <section
            id="experience"
            aria-labelledby="experience-title"
            className="py-28 md:py-44"
        >
            <div className="mx-auto max-w-[1600px] px-4 md:px-8">
                <div className="grid grid-cols-12 gap-x-6">
                    <div className="col-span-12 md:col-span-10 md:col-start-3">
                        <SectionLabel index={4}>Experience</SectionLabel>
                        {/* The orb stop: it lands as the full stop after the heading. */}
                        <div data-orb-stop="experience">
                            <RevealText as="h2" className="mt-4 text-display">
                                <span id="experience-title">
                                    Where I&rsquo;ve{' '}
                                    <Emphasis text="*worked*" />
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

                <div className="mt-12 grid grid-cols-12 gap-x-6 md:mt-20">
                    <ol className="col-span-12 space-y-14 md:col-span-10 md:col-start-3 md:space-y-20">
                        {experiences.map((experience) => (
                            <li
                                key={experience.id}
                                className="grid gap-3 md:grid-cols-10 md:gap-6"
                            >
                                <p className="font-mono text-label text-muted uppercase md:col-span-2 md:pt-2">
                                    <span className="block">
                                        {experience.type}
                                    </span>
                                    <span className="block">
                                        {experiencePeriod(experience)}
                                    </span>
                                </p>
                                <div className="md:col-span-8">
                                    <h3 className="text-title">
                                        {experience.position}{' '}
                                        <span className="font-display text-muted italic">
                                            at
                                        </span>{' '}
                                        {experience.url ? (
                                            <a
                                                href={experience.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="underline decoration-foreground/30 underline-offset-[0.15em] transition-colors hover:decoration-accent"
                                            >
                                                {experience.company}
                                            </a>
                                        ) : (
                                            experience.company
                                        )}
                                    </h3>
                                    {experience.location && (
                                        <p className="mt-2 font-mono text-label text-muted uppercase">
                                            {experience.location}
                                        </p>
                                    )}
                                    {experienceLines(experience).length > 0 && (
                                        <ul className="mt-4 max-w-[60ch] space-y-1 text-body text-foreground/70">
                                            {experienceLines(experience).map(
                                                (line) => (
                                                    <li key={line}>— {line}</li>
                                                ),
                                            )}
                                        </ul>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </section>
    );
}
