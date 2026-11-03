import { createInertiaApp } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';

void createInertiaApp({
    // Titles are composed per page in the <Seo> component.
    title: (title) => title,
    layout: () => PublicLayout,
    strictMode: true,
    progress: {
        color: '#4B5563',
    },
});
