<?php

namespace App\Filament\Resources\Experiences;

use App\Filament\Resources\Experiences\Pages\ManageExperiences;
use App\Models\Experience;
use BackedEnum;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class ExperienceResource extends Resource
{
    protected static ?string $model = Experience::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedClock;

    protected static ?string $recordTitleAttribute = 'position';

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('company')
                    ->required()
                    ->maxLength(255),
                TextInput::make('position')
                    ->required()
                    ->maxLength(255),
                DatePicker::make('start_date')
                    ->required(),
                DatePicker::make('end_date')
                    ->helperText('Leave empty if this is your current role.')
                    ->afterOrEqual('start_date'),
                Textarea::make('description')
                    ->rows(4)
                    ->columnSpanFull(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->reorderable('sort_order')
            ->defaultSort('sort_order')
            ->columns([
                TextColumn::make('position')
                    ->searchable()
                    ->description(fn (Experience $record) => $record->company),
                TextColumn::make('start_date')
                    ->date('M Y'),
                TextColumn::make('end_date')
                    ->date('M Y')
                    ->placeholder('Present'),
            ])
            ->recordActions([
                EditAction::make(),
                DeleteAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ManageExperiences::route('/'),
        ];
    }
}
