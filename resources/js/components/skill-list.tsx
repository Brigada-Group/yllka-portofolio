import type { Skill, SkillCategory } from '@/types';

const categories: { value: SkillCategory; label: string }[] = [
    { value: 'design', label: 'Design' },
    { value: 'frontend', label: 'Frontend' },
    { value: 'backend', label: 'Backend' },
    { value: 'tools', label: 'Tools' },
];

type SkillListProps = {
    skills: Skill[];
    /** `row` lays the categories out side by side, for horizontal sections. */
    layout?: 'grid' | 'row';
};

export default function SkillList({ skills, layout = 'grid' }: SkillListProps) {
    return (
        <div
            data-orb-row={layout === 'row' ? '' : undefined}
            className={
                layout === 'row'
                    ? 'flex w-max gap-6'
                    : 'grid gap-6 sm:grid-cols-2'
            }
        >
            {categories.map((category) => {
                const items = skills.filter(
                    (skill) => skill.category === category.value,
                );

                if (items.length === 0) {
                    return null;
                }

                return (
                    <div
                        key={category.value}
                        data-orb-item={layout === 'row' ? '' : undefined}
                        className={
                            layout === 'row' ? 'w-56 shrink-0' : undefined
                        }
                    >
                        <h3>{category.label}</h3>
                        <ul>
                            {items.map((skill) => (
                                <li key={skill.id}>{skill.name}</li>
                            ))}
                        </ul>
                    </div>
                );
            })}
        </div>
    );
}
