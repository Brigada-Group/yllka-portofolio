import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
    NAV_ITEMS,
    navHref,
    navNumber,
    useActiveSection,
    useNavJump,
} from '@/components/site-nav';
import { useIsMobile } from '@/hooks/use-media-query';
import { useLenis } from '@/lib/smooth-scroll';
import { home } from '@/routes';

/** Scrolled further than this (px), the bar gets its background. */
const SCROLLED_AT = 8;

/** The bar's height. Kept in sync with the spacer in the layout and the hero's min height. */
const BAR = 'h-20';

/** The site's content edges, shared with the hero's corner labels. */
const CONTAINER =
    'mx-auto flex max-w-[1600px] items-center justify-between px-4 md:px-8';

/**
 * A label that rolls on hover: it slides up and out while an identical
 * copy slides in from below. A plain colour change with reduced motion.
 */
function Roll({ children }: { children: ReactNode }) {
    return (
        <span className="nav-roll">
            <span>{children}</span>
            <span aria-hidden="true">{children}</span>
        </span>
    );
}

function useScrolled(): boolean {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const update = () => setScrolled(window.scrollY > SCROLLED_AT);
        update();
        window.addEventListener('scroll', update, { passive: true });

        return () => window.removeEventListener('scroll', update);
    }, []);

    return scrolled;
}

/** Full-screen menu for small screens. Focus stays inside; Esc closes it. */
function MobileMenu({ onClose, name }: { onClose: () => void; name: string }) {
    const panel = useRef<HTMLDivElement>(null);
    const lenis = useLenis();
    const active = useActiveSection();
    const jump = useNavJump();
    // Read through a ref, so a new callback doesn't re-run the effect (and refocus).
    const close = useRef(onClose);

    useEffect(() => {
        close.current = onClose;
    });

    useEffect(() => {
        const element = panel.current;

        if (!element) {
            return;
        }

        const focusable = () => [
            ...element.querySelectorAll<HTMLElement>('a[href], button'),
        ];
        focusable()[0]?.focus();

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                close.current();

                return;
            }

            if (event.key !== 'Tab') {
                return;
            }

            const items = focusable();
            const first = items[0];
            const last = items[items.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first?.focus();
            }
        };

        // The page behind doesn't scroll while the menu is open.
        lenis?.stop();
        document.documentElement.style.overflow = 'hidden';
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.documentElement.style.removeProperty('overflow');
            lenis?.start();
        };
    }, [lenis]);

    return createPortal(
        <div
            ref={panel}
            id="site-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="nav-menu fixed inset-0 z-40 flex flex-col bg-background"
        >
            <div className={`${BAR} w-full`}>
                <div className={`${CONTAINER} h-full`}>
                    <Link
                        href={home()}
                        onClick={onClose}
                        className="text-[15px] font-medium text-foreground"
                    >
                        {name}
                    </Link>
                    <button
                        type="button"
                        onClick={onClose}
                        className="font-mono text-[12px] tracking-[0.06em] text-muted uppercase transition-colors hover:text-foreground"
                    >
                        Close
                    </button>
                </div>
            </div>

            <nav aria-label="Main" className="flex flex-1 items-center px-4">
                <ul className="space-y-4">
                    {NAV_ITEMS.map((item, index) => (
                        <li key={item.section}>
                            <a
                                href={navHref(item.section)}
                                aria-current={
                                    active === item.section ? 'page' : undefined
                                }
                                onClick={(event) => {
                                    if (jump(event, item.section)) {
                                        onClose();
                                    }
                                }}
                                className="flex items-baseline gap-4 text-[40px] leading-tight tracking-[-0.02em] text-muted transition-colors hover:text-foreground aria-[current=page]:text-foreground"
                            >
                                <span
                                    aria-hidden="true"
                                    className="font-mono text-[12px] tracking-[0.06em] opacity-60"
                                >
                                    {navNumber(index)}
                                </span>
                                {item.label}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>,
        document.body,
    );
}

/**
 * The fixed top bar: the name (home) on the left, numbered section links on
 * the right, or a "Menu" button on small screens. Transparent at the top of
 * the page; a blurred, translucent bar once scrolled.
 */
export default function SiteHeader() {
    const { site } = usePage().props;
    const scrolled = useScrolled();
    const active = useActiveSection();
    const jump = useNavJump();
    const mobile = useIsMobile();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuButton = useRef<HTMLButtonElement>(null);

    const closeMenu = () => {
        setMenuOpen(false);
        menuButton.current?.focus();
    };

    // Close the menu on navigation, and if the window grows past mobile.
    useEffect(() => router.on('navigate', () => setMenuOpen(false)), []);

    if (menuOpen && !mobile) {
        setMenuOpen(false);
    }

    return (
        <header
            className={`fixed inset-x-0 top-0 z-30 border-b transition-[background-color,border-color,backdrop-filter] duration-300 ${
                scrolled
                    ? 'border-white/[0.06] bg-[rgba(14,14,15,0.7)] backdrop-blur-[12px]'
                    : 'border-transparent bg-transparent'
            }`}
        >
            <div className={`${CONTAINER} ${BAR}`}>
                <Link
                    href={home()}
                    className="text-[15px] font-medium whitespace-nowrap text-foreground"
                >
                    {site.name}
                </Link>

                <nav aria-label="Main" className="hidden md:block">
                    <ul className="flex gap-8">
                        {NAV_ITEMS.map((item, index) => {
                            const current = active === item.section;

                            return (
                                <li key={item.section}>
                                    <a
                                        href={navHref(item.section)}
                                        aria-current={
                                            current ? 'page' : undefined
                                        }
                                        onClick={(event) =>
                                            jump(event, item.section)
                                        }
                                        className="nav-link relative block font-mono text-[12px] tracking-[0.06em] text-muted uppercase transition-colors duration-300 hover:text-foreground aria-[current=page]:text-foreground"
                                    >
                                        {current && (
                                            <span
                                                aria-hidden="true"
                                                className="absolute top-1/2 -left-3 size-[5px] -translate-y-1/2 rounded-full bg-accent"
                                            />
                                        )}
                                        <Roll>
                                            <span
                                                aria-hidden="true"
                                                className="opacity-60"
                                            >
                                                {navNumber(index)}
                                            </span>{' '}
                                            {item.label}
                                        </Roll>
                                    </a>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <button
                    ref={menuButton}
                    type="button"
                    aria-expanded={menuOpen}
                    aria-controls="site-menu"
                    onClick={() => setMenuOpen(true)}
                    className="font-mono text-[12px] tracking-[0.06em] text-muted uppercase transition-colors hover:text-foreground md:hidden"
                >
                    Menu
                </button>
            </div>

            {menuOpen && <MobileMenu onClose={closeMenu} name={site.name} />}
        </header>
    );
}
