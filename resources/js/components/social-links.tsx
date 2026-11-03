import { usePage } from '@inertiajs/react';

const labels = {
    linkedin: 'LinkedIn',
    github: 'GitHub',
    dribbble: 'Dribbble',
    behance: 'Behance',
} as const;

export default function SocialLinks() {
    const { site } = usePage().props;
    const links = (Object.keys(labels) as (keyof typeof labels)[]).filter(
        (key) => site.social[key],
    );

    if (links.length === 0) {
        return null;
    }

    return (
        <ul className="flex gap-4">
            {links.map((key) => (
                <li key={key}>
                    <a
                        href={site.social[key]!}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {labels[key]}
                    </a>
                </li>
            ))}
        </ul>
    );
}
