import type { Skill, SkillCategory } from '@/types';

const categories: { value: SkillCategory; label: string }[] = [
    { value: 'design', label: 'Design' },
    { value: 'frontend', label: 'Frontend' },
    { value: 'backend', label: 'Backend' },
    { value: 'tools', label: 'Tools' },
];

export default function SkillList({ skills }: { skills: Skill[] }) {
    return (
        <div className="grid gap-6 sm:grid-cols-2">
            {categories.map((category) => {
                const items = skills.filter(
                    (skill) => skill.category === category.value,
                );

                if (items.length === 0) {
                    return null;
                }

                return (
                    <div key={category.value}>
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
