<?php

namespace Database\Seeders;

use App\Settings\SiteSettings;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class SiteSettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = app(SiteSettings::class);

        $settings->name = 'Alex Morgan';
        $settings->headline = 'Developer designing calm, usable interfaces.';
        $settings->bio = "I'm a frontend developer moving into UI/UX design. For the past six years I've built "
            .'product interfaces in React and Laravel, and somewhere along the way I realised the part I enjoy most '
            .'is figuring out what to build before writing any code: interviewing users, sketching flows and testing '
            .'prototypes. Because I can ship what I design, my handoffs are realistic and my prototypes are often the real thing.';
        $settings->avatar = PlaceholderImage::make('site', 'Avatar', 600, 600);
        $settings->resume = $this->resume();
        $settings->email = 'hello@example.com';
        $settings->location = 'Zurich, Switzerland';
        $settings->linkedin_url = 'https://www.linkedin.com/in/example';
        $settings->github_url = 'https://github.com/example';
        $settings->dribbble_url = 'https://dribbble.com/example';
        $settings->behance_url = null;

        $settings->save();
    }

    /**
     * Write a minimal one-page PDF so the resume download link works.
     */
    protected function resume(): string
    {
        $stream = 'BT /F1 24 Tf 72 720 Td (Resume placeholder) Tj ET';
        $objects = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
            '<< /Length '.strlen($stream)." >>\nstream\n{$stream}\nendstream",
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        ];

        $pdf = "%PDF-1.4\n";
        $offsets = [];
        foreach ($objects as $i => $object) {
            $offsets[] = strlen($pdf);
            $pdf .= ($i + 1)." 0 obj\n{$object}\nendobj\n";
        }

        $xref = strlen($pdf);
        $pdf .= "xref\n0 ".(count($objects) + 1)."\n0000000000 65535 f \n";
        foreach ($offsets as $offset) {
            $pdf .= sprintf("%010d 00000 n \n", $offset);
        }
        $pdf .= 'trailer << /Size '.(count($objects) + 1)." /Root 1 0 R >>\nstartxref\n{$xref}\n%%EOF\n";

        $path = 'site/resume.pdf';
        Storage::disk('public')->put($path, $pdf);

        return $path;
    }
}
