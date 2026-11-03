<?php

namespace App\Enums;

use Filament\Support\Contracts\HasLabel;

enum SkillCategory: string implements HasLabel
{
    case Design = 'design';
    case Frontend = 'frontend';
    case Backend = 'backend';
    case Tools = 'tools';

    public function getLabel(): string
    {
        return ucfirst($this->value);
    }
}
