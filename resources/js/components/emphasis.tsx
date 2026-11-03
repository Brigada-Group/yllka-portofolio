import { Fragment } from 'react';

/**
 * Renders text where words wrapped in *asterisks* are set in italic serif,
 * e.g. "UI/UX *Designer*". Used for the hero role, which is edited in Filament.
 */
export default function Emphasis({ text }: { text: string }) {
    return text.split(/(\*[^*]+\*)/).map((part, index) =>
        part.startsWith('*') && part.endsWith('*') ? (
            <em
                key={index}
                className="font-display font-normal tracking-normal italic"
            >
                {part.slice(1, -1)}
            </em>
        ) : (
            <Fragment key={index}>{part}</Fragment>
        ),
    );
}

/** The same text without the emphasis markers, for screen readers and titles. */
export const plainText = (text: string) => text.replaceAll('*', '');
