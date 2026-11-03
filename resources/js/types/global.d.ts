import type { SiteSettings } from '@/types/models';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            site: SiteSettings;
            [key: string]: unknown;
        };
        flashDataType: {
            success?: string;
        };
    }
}
