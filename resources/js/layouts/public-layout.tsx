import { Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import Container from '@/components/container';
import SocialLinks from '@/components/social-links';
import { SmoothScroll } from '@/lib/smooth-scroll';
import { about, contact, home } from '@/routes';
import projects from '@/routes/projects';

const navItems = [
    { label: 'Home', href: home() },
    { label: 'Projects', href: projects.index() },
    { label: 'About', href: about() },
    { label: 'Contact', href: contact() },
];

export default function PublicLayout({ children }: { children: ReactNode }) {
    const { site } = usePage().props;

    return (
        <SmoothScroll>
            <div aria-hidden className="grain" />
            {/* Content stacks above the fixed orb canvas (z-0). */}
            <div className="relative z-10 flex min-h-screen flex-col">
                <header>
                    <div className="flex items-center justify-between gap-6 px-4 py-6 md:px-8">
                        <Link href={home()} className="whitespace-nowrap">
                            {site.name}
                        </Link>
                        <nav>
                            <ul className="flex gap-3 text-sm md:gap-4 md:text-base">
                                {navItems.map((item) => (
                                    <li key={item.label}>
                                        <Link href={item.href}>
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </div>
                </header>

                <main className="flex-1">{children}</main>

                <footer>
                    <Container className="flex flex-wrap items-center justify-between gap-4 py-6">
                        <p>
                            © {new Date().getFullYear()} {site.name}
                        </p>
                        <SocialLinks />
                    </Container>
                </footer>
            </div>
        </SmoothScroll>
    );
}
