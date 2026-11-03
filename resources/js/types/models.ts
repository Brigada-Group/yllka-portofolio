// Shapes of the Eloquent models as they are serialized to Inertia props.
// Keep these in sync with the models in app/Models.

export type SkillCategory = 'design' | 'frontend' | 'backend' | 'tools';

export type Project = {
    id: number;
    title: string;
    slug: string;
    short_description: string;
    role: string;
    client: string | null;
    year: number;
    duration: string | null;
    tools: string[] | null;
    /** Rich text (HTML) written in Filament. */
    problem: string | null;
    process: string | null;
    solution: string | null;
    outcome: string | null;
    cover_image: string | null;
    cover_image_url: string | null;
    gallery: string[] | null;
    gallery_urls: string[];
    live_url: string | null;
    repo_url: string | null;
    figma_url: string | null;
    is_featured: boolean;
    is_published: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
};

/** The subset of a project loaded for lists and cards (see ProjectController::LIST_COLUMNS). */
export type ProjectSummary = Pick<
    Project,
    | 'id'
    | 'title'
    | 'slug'
    | 'short_description'
    | 'role'
    | 'client'
    | 'year'
    | 'tools'
    | 'cover_image'
    | 'cover_image_url'
    | 'is_featured'
>;

export type Skill = {
    id: number;
    name: string;
    category: SkillCategory;
    sort_order: number;
};

export type Experience = {
    id: number;
    company: string;
    position: string;
    /** Y-m-d */
    start_date: string;
    /** Y-m-d, or null for the current role. */
    end_date: string | null;
    description: string | null;
    sort_order: number;
};

export type Testimonial = {
    id: number;
    name: string;
    role: string;
    company: string;
    quote: string;
    avatar: string | null;
    avatar_url: string | null;
    is_published: boolean;
};

export type ContactMessage = {
    id: number;
    name: string;
    email: string;
    message: string;
    read_at: string | null;
    created_at: string;
};

/** Shared on every page by HandleInertiaRequests (SiteSettings::toPublicArray). */
export type SiteSettings = {
    name: string;
    headline: string;
    bio: string;
    avatar_url: string | null;
    resume_url: string | null;
    email: string;
    location: string | null;
    social: {
        linkedin: string | null;
        github: string | null;
        dribbble: string | null;
        behance: string | null;
    };
};
