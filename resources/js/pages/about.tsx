import { usePage } from '@inertiajs/react';
import ExperienceTimeline from '@/components/experience-timeline';
import Seo from '@/components/seo';
import SkillList from '@/components/skill-list';
import type { Experience, Skill, Testimonial } from '@/types';

type AboutProps = {
    experiences: Experience[];
    skills: Skill[];
    testimonials: Testimonial[];
};

export default function About({
    experiences,
    skills,
    testimonials,
}: AboutProps) {
    const { site } = usePage().props;

    return (
        <div className="space-y-12">
            <Seo
                title="About"
                description={`About ${site.name}: background, experience and skills.`}
            />

            <section className="space-y-4">
                <h1>About</h1>
                {site.avatar_url && (
                    <img
                        src={site.avatar_url}
                        alt={site.name}
                        className="size-32 object-cover"
                    />
                )}
                <p className="whitespace-pre-line">{site.bio}</p>
                {site.location && <p>Based in {site.location}</p>}
                {site.resume_url && (
                    <a href={site.resume_url} download>
                        Download resume (PDF)
                    </a>
                )}
            </section>

            {experiences.length > 0 && (
                <section className="space-y-6">
                    <h2>Experience</h2>
                    <ExperienceTimeline experiences={experiences} />
                </section>
            )}

            <section className="space-y-6">
                <h2>Skills</h2>
                <SkillList skills={skills} />
            </section>

            {testimonials.length > 0 && (
                <section className="space-y-6">
                    <h2>Kind words</h2>
                    {testimonials.map((testimonial) => (
                        <figure key={testimonial.id} className="space-y-2">
                            <blockquote>{testimonial.quote}</blockquote>
                            <figcaption className="flex items-center gap-3">
                                {testimonial.avatar_url && (
                                    <img
                                        src={testimonial.avatar_url}
                                        alt=""
                                        className="size-10 object-cover"
                                    />
                                )}
                                <span>
                                    {testimonial.name}, {testimonial.role} at{' '}
                                    {testimonial.company}
                                </span>
                            </figcaption>
                        </figure>
                    ))}
                </section>
            )}
        </div>
    );
}
