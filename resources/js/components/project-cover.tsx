import type { CSSProperties } from 'react';
import { plainText } from '@/components/emphasis';

/** A small, stable hash of a string (FNV-1a). */
function hash(text: string): number {
    let value = 2166136261;

    for (let i = 0; i < text.length; i++) {
        value ^= text.charCodeAt(i);
        value = Math.imul(value, 16777619);
    }

    return value >>> 0;
}

/**
 * A soft gradient mesh unique to a project, from its slug: three blurred
 * blobs in neighbouring hues, at positions that vary per project, on a dark
 * base (or a pale one, with lighter blobs, for the light theme). Used until a
 * real cover is uploaded.
 *
 * Returned as CSS variables; the `mesh` class picks the one for the theme.
 */
export function meshStyle(slug: string): CSSProperties {
    const seed = hash(slug);
    const hue = seed % 360;
    const at = (shift: number) => (seed >>> shift) % 100;
    const mesh = (light: boolean) => {
        const blob = (h: number, s: number, l: number, x: number, y: number) =>
            `radial-gradient(at ${x}% ${y}%, hsl(${h % 360} ${s}% ${light ? l + 12 : l}%) 0px, transparent 55%)`;

        return [
            blob(hue, 70, 62, 10 + (at(3) % 40), 10 + (at(7) % 40)),
            blob(hue + 40, 60, 55, 55 + (at(11) % 40), 20 + (at(13) % 50)),
            blob(hue + 300, 65, 68, 20 + (at(17) % 60), 60 + (at(19) % 35)),
            light
                ? `linear-gradient(hsl(${hue} 35% 90%), hsl(${(hue + 40) % 360} 30% 84%))`
                : `linear-gradient(hsl(${hue} 25% 14%), hsl(${(hue + 40) % 360} 25% 10%))`,
        ].join(', ');
    };

    return {
        '--mesh-dark': mesh(false),
        '--mesh-light': mesh(true),
    } as CSSProperties;
}

/** A project's cover image, or its gradient mesh with the title in small mono. */
export default function ProjectCover({
    slug,
    title,
    src,
    alt = '',
    className = '',
}: {
    slug: string;
    title: string;
    src: string | null;
    /** Empty (decorative) unless the cover shows something the title doesn't. */
    alt?: string | null;
    className?: string;
}) {
    if (src) {
        return (
            <img
                src={src}
                alt={alt ?? ''}
                loading="lazy"
                className={`size-full object-cover ${className}`}
            />
        );
    }

    return (
        <div
            aria-hidden="true"
            className={`mesh flex size-full items-end p-4 ${className}`}
            style={meshStyle(slug)}
        >
            <span className="font-mono text-label text-foreground/80 uppercase">
                {plainText(title)}
            </span>
        </div>
    );
}
