import { router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { MouseEvent } from 'react';
import { ScrollTrigger } from '@/lib/gsap';
import { useLenis } from '@/lib/smooth-scroll';
import { home } from '@/routes';

export type NavSection = 'work' | 'about' | 'contact';

/** Nav items: each jumps to a section of the home page. */
export const NAV_ITEMS: { label: string; section: NavSection }[] = [
    { label: 'Work', section: 'work' },
    { label: 'About', section: 'about' },
    { label: 'Contact', section: 'contact' },
];

export const navHref = (section: NavSection) => `${home().url}#${section}`;

/** "(01)" for the first item. */
export const navNumber = (index: number) =>
    `(${String(index + 1).padStart(2, '0')})`;

/** Other pages that belong to a section of the home page. */
const PAGE_SECTIONS: Record<string, NavSection> = {
    'projects/index': 'work',
    'projects/show': 'work',
    about: 'about',
    contact: 'contact',
};

/** Share of the viewport from the top that a section must reach to count as current. */
const ACTIVE_LINE = 0.4;

/**
 * The current section: on the home page, the last one whose top has scrolled
 * above 40% of the viewport (or the last one at the very bottom of the page);
 * elsewhere, the section the page belongs to.
 */
export function useActiveSection(): NavSection | null {
    const { component } = usePage();
    const [active, setActive] = useState<NavSection | null>(null);
    const onHome = component === 'home';

    useEffect(() => {
        if (!onHome) {
            return;
        }

        const update = () => {
            const line = window.innerHeight * ACTIVE_LINE;
            const atBottom =
                window.innerHeight + window.scrollY >=
                document.documentElement.scrollHeight - 2;
            let current: NavSection | null = null;

            for (const { section } of NAV_ITEMS) {
                const element = document.getElementById(section);

                if (element && element.getBoundingClientRect().top <= line) {
                    current = section;
                }
            }

            setActive(atBottom ? 'contact' : current);
        };

        update();
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);

        return () => {
            window.removeEventListener('scroll', update);
            window.removeEventListener('resize', update);
        };
    }, [onHome]);

    return onHome ? active : (PAGE_SECTIONS[component] ?? null);
}

/**
 * Click handling for nav links. On the home page, links jump straight to
 * their section; elsewhere, they go to the home page first and then jump
 * there. Links keep real addresses (/#about), so opening them in a new tab
 * works.
 */
export function useNavJump() {
    const { component } = usePage();
    const lenis = useLenis();

    const jumpTo = (section: NavSection) => {
        const target = document.getElementById(section);

        if (!target) {
            return;
        }

        const top = target.getBoundingClientRect().top + window.scrollY;

        if (lenis) {
            // Lenis re-measures the page only after a debounce, so after a visit
            // its scroll limit can still be the previous page's. Measure now.
            lenis.resize();
            lenis.scrollTo(top, { immediate: true, force: true });
        } else {
            window.scrollTo({ top });
        }

        window.history.replaceState(window.history.state, '', `#${section}`);
    };

    /** Returns false when the click was left to the browser (new tab, new window). */
    return (event: MouseEvent, section: NavSection): boolean => {
        if (
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey ||
            event.button !== 0
        ) {
            return false;
        }

        event.preventDefault();

        if (component === 'home') {
            jumpTo(section);

            return true;
        }

        // From another page: go home, then jump once the page has laid out.
        // Wait for the visit's `navigate` event (the smooth-scroll provider
        // re-syncs Lenis there, which would undo an earlier jump), then for
        // ScrollTrigger's refresh that lays out the page, or a short wait if
        // that has already happened.
        const off = router.on('navigate', () => {
            off();
            let done = false;
            const go = () => {
                if (!done) {
                    done = true;
                    ScrollTrigger.removeEventListener('refresh', go);
                    requestAnimationFrame(() => jumpTo(section));
                }
            };

            ScrollTrigger.addEventListener('refresh', go);
            setTimeout(go, 300);
        });

        router.visit(home().url);

        return true;
    };
}
