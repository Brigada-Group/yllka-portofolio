import type { Experience } from '@/types';

/** "2024 – Present", or "Apr 2023 – Dec 2023" when the entry shows months. */
export function experiencePeriod(experience: Experience): string {
    const format = (date: string) =>
        new Date(date).toLocaleDateString('en', {
            ...(experience.show_months ? { month: 'short' } : {}),
            year: 'numeric',
            timeZone: 'UTC',
        });

    return `${format(experience.start_date)} – ${experience.end_date ? format(experience.end_date) : 'Present'}`;
}

/** The description's lines (one item per line in Filament). */
export const experienceLines = (experience: Experience): string[] =>
    (experience.description ?? '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
