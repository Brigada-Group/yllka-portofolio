<?php

namespace Database\Seeders;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Generates neutral grey placeholder images on the public disk for the demo content.
 */
class PlaceholderImage
{
    /**
     * @param  positive-int  $width
     * @param  positive-int  $height
     */
    public static function make(string $directory, string $label, int $width = 1600, int $height = 1000): string
    {
        $image = imagecreatetruecolor($width, $height);
        // True-colour images take colours as 0xRRGGBB integers.
        imagefill($image, 0, 0, 0xE5E5E5);
        $text = 0x737373;
        $font = 5;
        $x = (int) (($width - imagefontwidth($font) * strlen($label)) / 2);
        $y = (int) (($height - imagefontheight($font)) / 2);
        imagestring($image, $font, max($x, 0), $y, $label, $text);

        ob_start();
        imagejpeg($image, null, 80);
        $contents = (string) ob_get_clean();
        imagedestroy($image);

        $path = trim($directory, '/').'/'.Str::slug($label).'-'.Str::random(6).'.jpg';
        Storage::disk('public')->put($path, $contents);

        return $path;
    }
}
