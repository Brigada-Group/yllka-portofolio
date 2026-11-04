import { usePage } from '@inertiajs/react';
import Hero from '@/components/hero';
import AboutStatement from '@/components/home/about-statement';
import ContactSection from '@/components/home/contact-section';
import ExperienceTrack from '@/components/home/experience-track';
import SkillsMarquee from '@/components/home/skills-marquee';
import WorkGallery from '@/components/home/work-gallery';
import { OrbStage } from '@/components/orb';
import { plainText } from '@/components/emphasis';
import Seo from '@/components/seo';
import type { Experience, ProjectSummary, Skill } from '@/types';

type HomeProps = {
    featuredProjects: ProjectSummary[];
    skills: Skill[];
    experiences: Experience[];
};

export default function Home({
    featuredProjects,
    skills,
    experiences,
}: HomeProps) {
    const { site } = usePage().props;

    return (
        <>
            <Seo
                description={`${[site.name, site.title].filter(Boolean).join(' — ')}. ${plainText(site.headline)}`}
            />
            <OrbStage />

            <Hero />
            <WorkGallery items={featuredProjects} />
            <AboutStatement />
            <SkillsMarquee skills={skills} />
            <ExperienceTrack experiences={experiences} />
            <ContactSection />
        </>
    );
}
