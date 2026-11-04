<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Alt text for project images: a column for the cover, and gallery items
     * become {image, alt} pairs instead of bare paths.
     */
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->string('cover_image_alt')->nullable()->after('cover_image');
        });

        DB::table('projects')->orderBy('id')->each(function (object $project) {
            $paths = json_decode($project->gallery ?? '[]', true) ?: [];

            DB::table('projects')->where('id', $project->id)->update([
                'gallery' => json_encode(array_map(
                    fn ($item) => is_string($item) ? ['image' => $item, 'alt' => null] : $item,
                    $paths,
                )),
            ]);
        });
    }

    public function down(): void
    {
        DB::table('projects')->orderBy('id')->each(function (object $project) {
            $items = json_decode($project->gallery ?? '[]', true) ?: [];

            DB::table('projects')->where('id', $project->id)->update([
                'gallery' => json_encode(array_column($items, 'image')),
            ]);
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn('cover_image_alt');
        });
    }
};
