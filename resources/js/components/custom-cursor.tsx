import { useEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/gsap';

/**
 * A circle that follows the mouse and shows a label over elements with
 * `data-cursor="Label"` (e.g. project cards: "View case"). Mouse only.
 */
export default function CustomCursor() {
    const element = useRef<HTMLDivElement>(null);
    const [label, setLabel] = useState<string | null>(null);

    useEffect(() => {
        const cursor = element.current;

        if (
            !cursor ||
            !window.matchMedia('(hover: hover) and (pointer: fine)').matches
        ) {
            return;
        }

        const reduced = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;
        const duration = reduced ? 0 : 0.35;
        const moveX = gsap.quickTo(cursor, 'x', { duration, ease: 'power3' });
        const moveY = gsap.quickTo(cursor, 'y', { duration, ease: 'power3' });

        const onMove = (event: PointerEvent) => {
            moveX(event.clientX);
            moveY(event.clientY);
            const target = (
                event.target as Element | null
            )?.closest<HTMLElement>('[data-cursor]');
            setLabel(target?.dataset.cursor ?? null);
        };
        const onLeave = () => setLabel(null);

        window.addEventListener('pointermove', onMove, { passive: true });
        document.documentElement.addEventListener('pointerleave', onLeave);

        return () => {
            window.removeEventListener('pointermove', onMove);
            document.documentElement.removeEventListener(
                'pointerleave',
                onLeave,
            );
        };
    }, []);

    return (
        <div
            ref={element}
            aria-hidden
            className="pointer-events-none fixed top-0 left-0 z-50 hidden md:block"
        >
            <div
                className={`flex size-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-foreground font-mono text-label text-background uppercase transition-[scale,opacity] duration-300 ease-out ${
                    label ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                }`}
            >
                {label}
            </div>
        </div>
    );
}
