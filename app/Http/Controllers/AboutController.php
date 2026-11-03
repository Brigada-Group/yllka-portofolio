<?php

namespace App\Http\Controllers;

use App\Models\Experience;
use App\Models\Skill;
use App\Models\Testimonial;
use Inertia\Inertia;
use Inertia\Response;

class AboutController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('about', [
            'experiences' => Experience::query()->ordered()->get(),
            'skills' => Skill::query()->ordered()->get(),
            'testimonials' => Testimonial::query()->where('is_published', true)->latest()->get(),
        ]);
    }
}
