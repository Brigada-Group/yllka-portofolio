<?php

namespace App\Filament\Resources\Projects\Schemas;

use App\Models\Project;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\RichEditor;
use Filament\Forms\Components\TagsInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Utilities\Get;
use Filament\Schemas\Components\Utilities\Set;
use Filament\Schemas\Schema;
use Illuminate\Support\Str;

class ProjectForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->columns(3)
            ->components([
                Section::make('Overview')
                    ->columnSpan(2)
                    ->columns(2)
                    ->schema([
                        TextInput::make('title')
                            ->required()
                            ->maxLength(255)
                            ->live(onBlur: true)
                            ->afterStateUpdated(function (Get $get, Set $set, ?string $old, ?string $state) {
                                // Keep the slug in sync until it has been edited by hand.
                                if (blank($get('slug')) || $get('slug') === Str::slug((string) $old)) {
                                    $set('slug', Str::slug((string) $state));
                                }
                            }),
                        TextInput::make('slug')
                            ->required()
                            ->maxLength(255)
                            ->alphaDash()
                            ->unique(Project::class, ignoreRecord: true),
                        Textarea::make('short_description')
                            ->required()
                            ->rows(3)
                            ->columnSpanFull(),
                        TextInput::make('role')
                            ->required()
                            ->placeholder('UI/UX Designer & Developer'),
                        TextInput::make('client'),
                        TextInput::make('year')
                            ->required()
                            ->numeric()
                            ->minValue(1990)
                            ->maxValue(2100)
                            ->default(now()->year),
                        TextInput::make('duration')
                            ->placeholder('3 months'),
                        TagsInput::make('tools')
                            ->placeholder('Add a tool')
                            ->columnSpanFull(),
                    ]),

                Section::make('Visibility')
                    ->columnSpan(1)
                    ->schema([
                        Toggle::make('is_published')
                            ->label('Published'),
                        Toggle::make('is_featured')
                            ->label('Featured on home page'),
                        FileUpload::make('cover_image')
                            ->image()
                            ->disk('public')
                            ->directory('projects/covers')
                            ->maxSize(4096),
                    ]),

                Section::make('Case study')
                    ->columnSpanFull()
                    ->schema([
                        static::richText('problem'),
                        static::richText('process'),
                        static::richText('solution'),
                        static::richText('outcome'),
                    ]),

                Section::make('Gallery')
                    ->columnSpanFull()
                    ->schema([
                        FileUpload::make('gallery')
                            ->hiddenLabel()
                            ->image()
                            ->multiple()
                            ->reorderable()
                            ->appendFiles()
                            ->panelLayout('grid')
                            ->disk('public')
                            ->directory('projects/gallery')
                            ->maxSize(4096),
                    ]),

                Section::make('Links')
                    ->columnSpanFull()
                    ->columns(3)
                    ->schema([
                        TextInput::make('live_url')->label('Live URL')->url(),
                        TextInput::make('repo_url')->label('Repository URL')->url(),
                        TextInput::make('figma_url')->label('Figma URL')->url(),
                    ]),
            ]);
    }

    protected static function richText(string $name): RichEditor
    {
        // Inline attachments are disabled so the stored HTML can be rendered
        // as-is on the frontend. Use the gallery for images.
        return RichEditor::make($name)
            ->fileAttachments(false);
    }
}
