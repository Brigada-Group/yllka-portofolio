<?php

namespace App\Models;

use App\Models\Concerns\HasSortOrder;
use Database\Factories\ExperienceFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['company', 'position', 'start_date', 'end_date', 'description', 'sort_order'])]
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
            'start_date' => 'date:Y-m-d',
            'end_date' => 'date:Y-m-d',
            'sort_order' => 'integer',
        ];
    }
}
