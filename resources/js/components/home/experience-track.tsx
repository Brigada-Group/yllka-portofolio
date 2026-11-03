import Emphasis from '@/components/emphasis';
import RevealText from '@/components/reveal-text';
import SectionLabel from '@/components/section-label';
import type { Experience } from '@/types';

const year = (date: string) => new Date(date).getUTCFullYear();

/**
 * (04) Experience: the orb rolls down the line in the rail as the page
 * scrolls, and each entry lights up as the orb reaches it (see
 * `data-orb-track` and `data-orb-entry` in the orb path).
 */
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
            <div
                data-orb-stop="experience"
                data-orb-side="left"
                className="mx-auto max-w-[1600px] px-4 md:px-8"
            >
                <div className="grid grid-cols-12 gap-x-6">
                    <div className="col-span-12 md:col-span-10 md:col-start-3">
                        <SectionLabel index={4}>Experience</SectionLabel>
                        <RevealText as="h2" className="mt-4 text-display">
                            <span id="experience-title">
                                Where I&rsquo;ve <Emphasis text="*worked*" />
                            </span>
                        </RevealText>
                    </div>
                </div>

                <div className="relative mt-12 grid grid-cols-12 gap-x-6 md:mt-20">
                    {/* The line the orb rolls down: as wide as the orb, with a hairline down its middle. */}
                    <div className="absolute inset-y-0 left-0 md:static md:col-span-2 md:flex md:justify-center">
                        <div
                            data-orb-track
                            aria-hidden="true"
                            className="h-full w-4 bg-[linear-gradient(rgb(242_240_235/0.2),rgb(242_240_235/0.2))] bg-[length:1px_100%] bg-center bg-no-repeat md:w-12"
                        />
                    </div>

                    <ol className="col-span-12 space-y-14 pl-8 md:col-span-10 md:space-y-20 md:pl-0">
                        {experiences.map((experience) => (
                            <li
                                key={experience.id}
                                data-orb-entry
                                className="grid gap-3 md:grid-cols-10 md:gap-6"
                            >
                                <p className="font-mono text-label text-muted uppercase md:col-span-2 md:pt-2">
                                    {year(experience.start_date)} —{' '}
                                    {experience.end_date
                                        ? year(experience.end_date)
                                        : 'Now'}
                                </p>
                                <div className="md:col-span-8">
                                    <h3 className="text-title">
                                        {experience.position}{' '}
                                        <span className="font-display text-muted italic">
                                            at
                                        </span>{' '}
                                        {experience.company}
                                    </h3>
                                    {experience.description && (
                                        <p className="mt-4 max-w-[60ch] text-body text-foreground/70">
                                            {experience.description}
                                        </p>
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
