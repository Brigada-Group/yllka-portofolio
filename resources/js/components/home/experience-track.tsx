import Emphasis from '@/components/emphasis';
import RevealText from '@/components/reveal-text';
import SectionLabel from '@/components/section-label';
import type { Experience } from '@/types';

const year = (date: string) => new Date(date).getUTCFullYear();

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
