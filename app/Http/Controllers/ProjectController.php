<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    /**
     * Columns needed for project cards. The case study body is only loaded on the detail page.
     */
    public const LIST_COLUMNS = [
        'id', 'title', 'slug', 'short_description', 'role', 'category', 'client', 'year', 'tools', 'cover_image', 'cover_image_alt', 'is_featured',
    ];

    public function index(): Response
    {
        return Inertia::render('projects/index', [
            'projects' => Project::query()->published()->ordered()->get(self::LIST_COLUMNS)->setAppends(['cover_image_url']),
        ]);
    }

    public function show(string $slug): Response
    {
        $project = Project::query()->published()->where('slug', $slug)->firstOrFail();

        return Inertia::render('projects/show', [
            'project' => $project,
        ]);
    }
}
