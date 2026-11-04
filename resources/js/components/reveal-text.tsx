import { useRef } from 'react';
import type { ElementType, ReactNode } from 'react';
import { useReducedMotion } from '@/lib/motion';
import { gsap, SplitText, useGSAP } from '@/lib/gsap';

type RevealTextProps = {
    as?: ElementType;
    className?: string;
    children: ReactNode;
};

/**
 * Text whose lines slide up from behind a mask, one after the other, when it
 * scrolls into view. Re-splits on resize and font load. Plain text with
 * reduced motion.
 */
export default function RevealText({
    as: Tag = 'div',
    className,
    children,
}: RevealTextProps) {
    const element = useRef<HTMLElement>(null);
    const reducedMotion = useReducedMotion();

    useGSAP(
        () => {
            if (reducedMotion || !element.current) {
                return;
            }

            const split = SplitText.create(element.current, {
                type: 'lines',
                mask: 'lines',
                autoSplit: true,
                onSplit: (self) =>
                    gsap.from(self.lines, {
                        yPercent: 105,
                        duration: 1.1,
                        ease: 'expo.out',
                        stagger: 0.08,
                        scrollTrigger: {
                            trigger: element.current,
                            start: 'top 85%',
                            once: true,
                        },
                    }),
            });

            return () => split.revert();
        },
        { dependencies: [reducedMotion], scope: element, revertOnUpdate: true },
    );

    return (
        <Tag ref={element} className={className}>
            {children}
        </Tag>
    );
}
