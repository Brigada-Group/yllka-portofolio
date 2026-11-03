import type { Experience } from '@/types';

const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en', {
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
    });

export default function ExperienceTimeline({
    experiences,
}: {
    experiences: Experience[];
}) {
    return (
        <ol className="space-y-6">
            {experiences.map((experience) => (
                <li key={experience.id}>
                    <h3>
                        {experience.position}, {experience.company}
                    </h3>
                    <p>
                        <time dateTime={experience.start_date}>
                            {formatDate(experience.start_date)}
                        </time>
                        {' – '}
                        {experience.end_date ? (
                            <time dateTime={experience.end_date}>
                                {formatDate(experience.end_date)}
                            </time>
                        ) : (
                            'Present'
                        )}
                    </p>
                    {experience.description && <p>{experience.description}</p>}
                </li>
            ))}
        </ol>
    );
}
