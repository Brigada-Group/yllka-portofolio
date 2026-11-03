<?php

namespace App\Models;

use App\Enums\SkillCategory;
use App\Models\Concerns\HasSortOrder;
use Database\Factories\SkillFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['name', 'category', 'sort_order'])]
class Skill extends Model
{
    /** @use HasFactory<SkillFactory> */
    use HasFactory, HasSortOrder;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'category' => SkillCategory::class,
            'sort_order' => 'integer',
        ];
    }
}
