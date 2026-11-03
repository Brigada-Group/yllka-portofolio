<?php

namespace App\Http\Controllers;

use App\Models\Experience;
use App\Models\Project;
use App\Models\Skill;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('home', [
            'featuredProjects' => Project::query()
                ->published()
                ->where('is_featured', true)
                ->ordered()
                ->get(ProjectController::LIST_COLUMNS)
                ->setAppends(['cover_image_url']),
            'skills' => Skill::query()->ordered()->get(),
            'experiences' => Experience::query()->ordered()->get(),
        ]);
    }
}
