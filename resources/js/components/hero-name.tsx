import { useEffect } from 'react';
import type { RefObject } from 'react';
import { gsap } from '@/lib/gsap';

/** Geist's weight axis: letters near the cursor go from light to medium. */
const BASE_WEIGHT = 300;
const PEAK_WEIGHT = 500;
/** How far from a letter's centre (px) the cursor still thickens it. */
const REACH = 150;
/** How quickly weights ease towards their target, per second. */
const SMOOTHING = 10;

/**
 * Thickens the letters of `root` near the cursor. Each letter's width is
 * locked to its light width first, so heavier letters never push the rest
 * of the name along. That keeps the ı (and the orb sitting on it) in place;
 * the ı itself keeps its weight, as the orb's dot is measured from it.
 */
function useProximityWeight(
    root: RefObject<HTMLElement | null>,
    enabled: boolean,
) {
    useEffect(() => {
        const element = root.current;

        if (
            !enabled ||
            !element ||
            !window.matchMedia('(hover: hover) and (pointer: fine)').matches
        ) {
            return;
        }

        const letters = [
            ...element.querySelectorAll<HTMLElement>('[data-letter]'),
        ];
        const weights = letters.map(() => BASE_WEIGHT);
        let pointer: { x: number; y: number } | null = null;
        let locked = false;
        let cancelled = false;

        // Widths in em, so they keep scaling with the fluid type size.
        void document.fonts.ready.then(() => {
            if (cancelled) {
                return;
            }

            const size = parseFloat(getComputedStyle(element).fontSize);
            const widths = letters.map(
                (letter) => letter.getBoundingClientRect().width / size,
            );
            letters.forEach((letter, index) => {
                letter.style.display = 'inline-block';
                letter.style.width = `${widths[index]}em`;
            });
            locked = true;
        });

        const onMove = (event: PointerEvent) => {
            pointer = { x: event.clientX, y: event.clientY };
        };
        const onLeave = () => {
            pointer = null;
        };

        const tick = (_time: number, deltaMs: number) => {
            if (
                !locked ||
                (!pointer && weights.every((weight) => weight === BASE_WEIGHT))
            ) {
                return;
            }

            const ease = 1 - Math.exp(-SMOOTHING * (deltaMs / 1000));

            letters.forEach((letter, index) => {
                let target = BASE_WEIGHT;

                if (pointer) {
                    const box = letter.getBoundingClientRect();
                    const distance = Math.hypot(
                        pointer.x - (box.left + box.width / 2),
                        pointer.y - (box.top + box.height / 2),
                    );
                    const t = Math.max(0, 1 - distance / REACH);
                    target =
                        BASE_WEIGHT +
                        (PEAK_WEIGHT - BASE_WEIGHT) * t * t * (3 - 2 * t);
                }

                const current = weights[index];
                const next =
                    Math.abs(target - current) < 0.5
                        ? target
                        : current + (target - current) * ease;

                if (next !== current) {
                    weights[index] = next;
                    letter.style.fontWeight = String(Math.round(next));
                }
            });
        };

        window.addEventListener('pointermove', onMove, { passive: true });
        document.documentElement.addEventListener('pointerleave', onLeave);
        gsap.ticker.add(tick);

        return () => {
            cancelled = true;
            window.removeEventListener('pointermove', onMove);
            document.documentElement.removeEventListener(
                'pointerleave',
                onLeave,
            );
            gsap.ticker.remove(tick);
            letters.forEach((letter) => {
                letter.style.removeProperty('display');
                letter.style.removeProperty('width');
                letter.style.removeProperty('font-weight');
            });
        };
    }, [root, enabled]);
}

/**
 * The name, one span per letter, with its last "i" set dotless (ı): the orb
 * drops onto the spot where the dot would be and becomes it (see
 * `data-orb-dot` in the orb path, which measures the dot from the font).
 * Decorative: the h1's accessible name is given separately.
 */
export default function HeroName({
    name,
    nameRef,
    weightEffect,
}: {
    name: string;
    nameRef: RefObject<HTMLSpanElement | null>;
    weightEffect: boolean;
}) {
    useProximityWeight(nameRef, weightEffect);
    const dot = name.lastIndexOf('i');

    return (
        <span ref={nameRef} className="hero-name block text-hero font-light">
            {name.split('').map((letter, index) => {
                if (letter === ' ') {
                    return ' ';
                }

                return index === dot ? (
                    <span key={index} data-orb-dot>
                        ı
                    </span>
                ) : (
                    <span key={index} data-letter>
                        {letter}
                    </span>
                );
            })}
        </span>
    );
}
