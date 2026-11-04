import { experienceLines, experiencePeriod } from '@/lib/experience';
import type { Experience } from '@/types';

export default function ExperienceTimeline({
    experiences,
}: {
    experiences: Experience[];
}) {
    return (
        <ol className="space-y-8">
            {experiences.map((experience) => {
                const lines = experienceLines(experience);

                return (
                    <li key={experience.id} className="space-y-1">
                        <p className="font-mono text-label text-muted uppercase">
                            {experience.type} · {experiencePeriod(experience)}
                        </p>
                        <h3>
                            {experience.position},{' '}
                            {experience.url ? (
                                <a
                                    href={experience.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline"
                                >
                                    {experience.company}
                                </a>
                            ) : (
                                experience.company
                            )}
                            {experience.location && `, ${experience.location}`}
                        </h3>
                        {lines.length > 1 ? (
                            <ul className="list-disc pl-5">
                                {lines.map((line) => (
                                    <li key={line}>{line}</li>
                                ))}
                            </ul>
                        ) : (
                            lines[0] && <p>{lines[0]}</p>
                        )}
                    </li>
                );
            })}
        </ol>
    );
}
