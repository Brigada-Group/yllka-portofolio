<?php

use App\Models\Project;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Sections cleared in the admin were saved as an empty paragraph ("<p></p>"),
     * so their headings still showed. Store them as null, as saving now does.
     */
    public function up(): void
    {
        DB::table('projects')->orderBy('id')->each(function (object $project) {
            $blank = array_filter(
                Project::SECTIONS,
                fn (string $section) => $project->{$section} !== null && Project::isBlankHtml($project->{$section}),
            );

            if ($blank !== []) {
                DB::table('projects')->where('id', $project->id)->update(array_fill_keys($blank, null));
            }
        });
    }
};
