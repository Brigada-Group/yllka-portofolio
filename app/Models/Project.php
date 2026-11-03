<?php

namespace App\Models;

use App\Models\Concerns\HasSortOrder;
use Database\Factories\ProjectFactory;
use Illuminate\Database\Eloquent\Attributes\Appends;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * @property list<string>|null $tools
 * @property list<string>|null $gallery
 */
#[Fillable([
    'title', 'slug', 'short_description', 'role', 'category', 'client', 'year', 'duration', 'tools',
    'problem', 'process', 'solution', 'outcome', 'cover_image', 'gallery',
    'live_url', 'repo_url', 'figma_url', 'is_featured', 'is_published', 'sort_order',
])]
#[Appends(['cover_image_url', 'gallery_urls'])]
class Project extends Model
{
    /** @use HasFactory<ProjectFactory> */
    use HasFactory, HasSortOrder;

    protected static function booted(): void
    {
        static::saving(function (Project $project) {
            $project->slug = $project->slug ?: Str::slug($project->title);
        });
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'tools' => 'array',
            'gallery' => 'array',
            'is_featured' => 'boolean',
            'is_published' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * @param  Builder<Project>  $query
     */
    #[Scope]
    protected function published(Builder $query): void
    {
        $query->where('is_published', true);
    }

    /**
     * @return Attribute<string|null, never>
     */
    protected function coverImageUrl(): Attribute
    {
        return Attribute::get(fn () => $this->cover_image ? Storage::disk('public')->url($this->cover_image) : null);
    }

    /**
     * @return Attribute<list<string>, never>
     */
    protected function galleryUrls(): Attribute
    {
        return Attribute::get(fn () => array_map(
            fn (string $path) => Storage::disk('public')->url($path),
            $this->gallery ?? [],
        ));
    }
}
