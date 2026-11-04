<?php

namespace App\Models;

use App\Enums\ExperienceType;
use App\Models\Concerns\HasSortOrder;
use Database\Factories\ExperienceFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['type', 'company', 'position', 'location', 'url', 'start_date', 'end_date', 'show_months', 'description', 'sort_order'])]
class Experience extends Model
{
    /** @use HasFactory<ExperienceFactory> */
    use HasFactory, HasSortOrder;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => ExperienceType::class,
            'start_date' => 'date:Y-m-d',
            'end_date' => 'date:Y-m-d',
            'show_months' => 'boolean',
            'sort_order' => 'integer',
        ];
    }
}
