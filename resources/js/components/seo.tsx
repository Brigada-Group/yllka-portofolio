import { Head, usePage } from '@inertiajs/react';

type SeoProps = {
    /**
     * Page title, followed by the site name ("Projects — Yllka Selimi").
     * Omit on the home page, which is titled with the name and title
     * ("Yllka Selimi — UI/UX and Frontend Specialist").
     */
    title?: string;
    description: string;
};

export default function Seo({ title, description }: SeoProps) {
    const { site } = usePage().props;
    const fullTitle = title
        ? `${title} — ${site.name}`
        : [site.name, site.title].filter(Boolean).join(' — ');

    return (
        <Head title={fullTitle}>
            <meta
                head-key="description"
                name="description"
                content={description}
            />
            <meta head-key="og:title" property="og:title" content={fullTitle} />
            <meta
                head-key="og:description"
                property="og:description"
                content={description}
            />
        </Head>
    );
}
