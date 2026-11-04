import { usePage } from '@inertiajs/react';

/** The languages from site settings, e.g. "Albanian — Native". Hidden when there are none. */
export default function Languages({ className = '' }: { className?: string }) {
    const { site } = usePage().props;

    if (site.languages.length === 0) {
        return null;
    }

    return (
        <div className={className}>
            <p className="font-mono text-label text-muted uppercase">
                Languages
            </p>
            <ul className="mt-3 space-y-1">
                {site.languages.map(({ language, level }) => (
                    <li key={language}>
                        {language} <span className="text-muted">— {level}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
