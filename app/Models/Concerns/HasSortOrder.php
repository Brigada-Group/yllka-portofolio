<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;

/**
 * New records go to the end of the list. Reordering happens by drag and drop in Filament.
 */
trait HasSortOrder
{
    protected static function bootHasSortOrder(): void
    {
        static::creating(function (self $model) {
            $model->sort_order ??= max(0, (int) static::query()->max('sort_order')) + 1;
        });
    }

    /**
     * @param  Builder<static>  $query
     */
    public function scopeOrdered(Builder $query): void
    {
        $query->orderBy('sort_order');
    }
}
