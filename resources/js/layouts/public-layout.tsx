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
            {/* Content stacks above the fixed orb canvas (z-0). */}
            <div className="relative z-10 flex min-h-screen flex-col">
                <header>
                    <Container className="flex items-center justify-between py-6">
                        <Link href={home()}>{site.name}</Link>
                        <nav>
                            <ul className="flex gap-4">
                                {navItems.map((item) => (
                                    <li key={item.label}>
                                        <Link href={item.href}>
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </Container>
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
