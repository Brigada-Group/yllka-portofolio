<?php

namespace App\Filament\Pages;

use App\Settings\SiteSettings;
use BackedEnum;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Pages\SettingsPage;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;

class ManageSiteSettings extends SettingsPage
{
    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedCog6Tooth;

    protected static ?string $navigationLabel = 'Site settings';

    protected static ?string $title = 'Site settings';

    protected static ?string $slug = 'settings';

    protected static ?int $navigationSort = 100;

    protected static string $settings = SiteSettings::class;

    public function form(Schema $schema): Schema
    {
        return $schema
            ->columns(3)
            ->components([
                Section::make('Profile')
                    ->columnSpan(2)
                    ->schema([
                        TextInput::make('name')
                            ->required()
                            ->maxLength(255),
                        TextInput::make('headline')
                            ->required()
                            ->maxLength(255),
                        Textarea::make('bio')
                            ->required()
                            ->rows(6),
                        TextInput::make('email')
                            ->email()
                            ->required(),
                        TextInput::make('location'),
                    ]),

                Section::make('Files')
                    ->columnSpan(1)
                    ->schema([
                        FileUpload::make('avatar')
                            ->image()
                            ->avatar()
                            ->disk('public')
                            ->directory('site')
                            ->maxSize(2048),
                        FileUpload::make('resume')
                            ->label('Resume (PDF)')
                            ->acceptedFileTypes(['application/pdf'])
                            ->disk('public')
                            ->directory('site')
                            ->maxSize(10240)
                            ->openable()
                            ->downloadable(),
                    ]),

                Section::make('Social links')
                    ->columnSpanFull()
                    ->columns(2)
                    ->schema([
                        TextInput::make('linkedin_url')->label('LinkedIn')->url(),
                        TextInput::make('github_url')->label('GitHub')->url(),
                        TextInput::make('dribbble_url')->label('Dribbble')->url(),
                        TextInput::make('behance_url')->label('Behance')->url(),
                    ]),
            ]);
    }
}
