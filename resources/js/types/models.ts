// Shapes of the Eloquent models as they are serialized to Inertia props.
// Keep these in sync with the models in app/Models.

export type SkillCategory = 'design' | 'frontend' | 'backend' | 'tools';

export type Project = {
    id: number;
    title: string;
    slug: string;
    short_description: string;
    /** Who it was built with or for, when given. */
    context: string | null;
    role: string;
    category: string | null;
    client: string | null;
    year: number | null;
    duration: string | null;
    tools: string[] | null;
    /** Rich text (HTML) written in Filament. */
    problem: string | null;
    process: string | null;
    solution: string | null;
    outcome: string | null;
    cover_image: string | null;
    cover_image_url: string | null;
    /** Describes the cover for screen readers; empty when it is decorative. */
    cover_image_alt: string | null;
    gallery: { image: string; alt: string | null }[] | null;
    gallery_images: { url: string; alt: string | null }[];
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
    | 'category'
    | 'client'
    | 'year'
    | 'tools'
    | 'cover_image'
    | 'cover_image_url'
    | 'cover_image_alt'
    | 'is_featured'
>;

export type Skill = {
    id: number;
    name: string;
    category: SkillCategory;
    sort_order: number;
};

export type ExperienceType = 'work' | 'education' | 'course';

export type Experience = {
    id: number;
    type: ExperienceType;
    company: string;
    position: string;
    location: string | null;
    url: string | null;
    /** Show months, not just years, in the dates. */
    show_months: boolean;
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
    /** Professional title, e.g. "Frontend Developer · UI/UX". */
    title: string;
    /** Sentence under the name in the hero. Words in *asterisks* are set in italic serif. */
    headline: string;
    /** Short role, shown in a corner of the hero. */
    role: string;
    education: string | null;
    bio: string;
    avatar_url: string | null;
    resume_url: string | null;
    email: string;
    phone: string | null;
    languages: { language: string; level: string }[];
    location: string | null;
    /** IANA timezone for the hero's live local time. */
    timezone: string;
    social: {
        linkedin: string | null;
        github: string | null;
        dribbble: string | null;
        behance: string | null;
    };
};
