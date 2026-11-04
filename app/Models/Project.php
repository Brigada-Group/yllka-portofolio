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
 * @property list<array{image: string, alt: string|null}>|null $gallery
 */
#[Fillable([
    'title', 'slug', 'short_description', 'context', 'role', 'category', 'client', 'year', 'duration', 'tools',
    'problem', 'process', 'solution', 'outcome', 'cover_image', 'cover_image_alt', 'gallery',
    'live_url', 'repo_url', 'figma_url', 'is_featured', 'is_published', 'sort_order',
])]
#[Appends(['cover_image_url', 'gallery_images'])]
class Project extends Model
{
    /** @use HasFactory<ProjectFactory> */
    use HasFactory, HasSortOrder;

    /** Case study sections, written in the rich editor. */
    public const SECTIONS = ['problem', 'process', 'solution', 'outcome'];

    protected static function booted(): void
    {
        static::saving(function (Project $project) {
            $project->slug = $project->slug ?: Str::slug($project->title);

            // A cleared rich editor still saves an empty paragraph. Store
            // nothing instead, so the section (and its heading) is left out.
            foreach (self::SECTIONS as $section) {
                if (self::isBlankHtml($project->{$section})) {
                    $project->{$section} = null;
                }
            }
        });
    }

    /** True when rich text has no words and no media, e.g. "<p></p>" or "<p><br></p>". */
    public static function isBlankHtml(?string $html): bool
    {
        if ($html === null) {
            return true;
        }

        if (preg_match('/<(img|video|iframe|figure)\b/i', $html)) {
            return false;
        }

        $text = html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5);

        return trim(str_replace("\u{00A0}", ' ', $text)) === '';
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
     * Gallery images with their alt text, for the case study page.
     *
     * @return Attribute<list<array{url: string, alt: string|null}>, never>
     */
    protected function galleryImages(): Attribute
    {
        return Attribute::get(fn () => array_map(
            fn (array $item) => [
                'url' => Storage::disk('public')->url($item['image']),
                'alt' => $item['alt'] ?? null,
            ],
            $this->gallery ?? [],
        ));
    }
}
