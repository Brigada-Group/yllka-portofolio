<?php

namespace App\Filament\Pages;

use App\Settings\SiteSettings;
use BackedEnum;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
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
                        TextInput::make('role')
                            ->required()
                            ->maxLength(60)
                            ->helperText('Shown in a corner of the hero, e.g. "Full-stack @ Brigada".'),
                        TextInput::make('education')
                            ->maxLength(80)
                            ->helperText('Shown in a corner of the hero.'),
                        TextInput::make('headline')
                            ->helperText('Shown under your name in the hero. Wrap words in *asterisks* to set them in italic serif.')
                            ->required()
                            ->maxLength(255),
                        Textarea::make('bio')
                            ->required()
                            ->rows(6),
                        TextInput::make('email')
                            ->email()
                            ->required(),
                        TextInput::make('location'),
                        Select::make('timezone')
                            ->options(fn () => array_combine(timezone_identifiers_list(), timezone_identifiers_list()))
                            ->searchable()
                            ->required()
                            ->helperText('For the live local time in the hero.'),
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
