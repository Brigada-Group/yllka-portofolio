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
 * A soft gradient mesh unique to a project, from its slug: a dark base
 * with three blurred blobs in neighbouring hues, at positions that vary
 * per project. Used until a real cover is uploaded.
 */
export function meshBackground(slug: string): string {
    const seed = hash(slug);
    const hue = seed % 360;
    const at = (shift: number) => (seed >>> shift) % 100;
    const blob = (h: number, s: number, l: number, x: number, y: number) =>
        `radial-gradient(at ${x}% ${y}%, hsl(${h % 360} ${s}% ${l}%) 0px, transparent 55%)`;

    return [
        blob(hue, 70, 62, 10 + (at(3) % 40), 10 + (at(7) % 40)),
        blob(hue + 40, 60, 55, 55 + (at(11) % 40), 20 + (at(13) % 50)),
        blob(hue + 300, 65, 68, 20 + (at(17) % 60), 60 + (at(19) % 35)),
        `linear-gradient(hsl(${hue} 25% 14%), hsl(${(hue + 40) % 360} 25% 10%))`,
    ].join(', ');
}

/** A project's cover image, or its gradient mesh with the title in small mono. */
export default function ProjectCover({
    slug,
    title,
    src,
    className = '',
}: {
    slug: string;
    title: string;
    src: string | null;
    className?: string;
}) {
    if (src) {
        return (
            <img
                src={src}
                alt=""
                loading="lazy"
                className={`size-full object-cover ${className}`}
            />
        );
    }

    return (
        <div
            aria-hidden="true"
            className={`flex size-full items-end p-4 ${className}`}
            style={{ backgroundImage: meshBackground(slug) }}
        >
            <span className="font-mono text-label text-foreground/80 uppercase">
                {plainText(title)}
            </span>
        </div>
    );
}
