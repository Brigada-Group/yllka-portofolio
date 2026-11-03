import { Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import SocialLinks from '@/components/social-links';
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
        <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-4">
            <header className="flex items-center justify-between py-6">
                <Link href={home()}>{site.name}</Link>
                <nav>
                    <ul className="flex gap-4">
                        {navItems.map((item) => (
                            <li key={item.label}>
                                <Link href={item.href}>{item.label}</Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            </header>

            <main className="flex-1 py-8">{children}</main>

            <footer className="flex flex-wrap items-center justify-between gap-4 py-6">
                <p>
                    © {new Date().getFullYear()} {site.name}
                </p>
                <SocialLinks />
            </footer>
        </div>
    );
}
