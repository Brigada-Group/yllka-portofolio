import { Head, usePage } from '@inertiajs/react';

type SeoProps = {
    /** Page title. The site name is appended automatically. Omit on the home page. */
    title?: string;
    description: string;
};

export default function Seo({ title, description }: SeoProps) {
    const { site } = usePage().props;
    const fullTitle = title ? `${title} | ${site.name}` : site.name;

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
