<?php

namespace App\Enums;

use Filament\Support\Contracts\HasLabel;

enum ExperienceType: string implements HasLabel
{
    case Work = 'work';
    case Education = 'education';
    case Course = 'course';

    public function getLabel(): string
    {
        return ucfirst($this->value);
    }
}
