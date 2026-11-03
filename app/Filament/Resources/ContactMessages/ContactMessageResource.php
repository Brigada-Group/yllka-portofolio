<?php

namespace App\Filament\Resources\ContactMessages;

use App\Filament\Resources\ContactMessages\Pages\ManageContactMessages;
use App\Models\ContactMessage;
use BackedEnum;
use Filament\Actions\Action;
use Filament\Actions\BulkAction;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\ViewAction;
use Filament\Infolists\Components\TextEntry;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Collection;

class ContactMessageResource extends Resource
{
    protected static ?string $model = ContactMessage::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedInbox;

    protected static ?string $navigationLabel = 'Messages';

    protected static ?string $recordTitleAttribute = 'name';

    public static function canCreate(): bool
    {
        return false;
    }

    public static function getNavigationBadge(): ?string
    {
        $count = ContactMessage::query()->unread()->count();

        return $count > 0 ? (string) $count : null;
    }

    public static function getNavigationBadgeTooltip(): ?string
    {
        return 'Unread messages';
    }

    public static function infolist(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextEntry::make('name'),
                TextEntry::make('email')
                    ->label('Email address')
                    ->copyable(),
                TextEntry::make('created_at')
                    ->label('Received')
                    ->dateTime(),
                TextEntry::make('read_at')
                    ->dateTime()
                    ->placeholder('Unread'),
                TextEntry::make('message')
                    ->columnSpanFull(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                IconColumn::make('read_at')
                    ->label('Read')
                    ->boolean()
                    ->state(fn (ContactMessage $record) => $record->read_at !== null),
                TextColumn::make('name')
                    ->searchable()
                    ->weight(fn (ContactMessage $record) => $record->read_at ? null : 'bold'),
                TextColumn::make('email')
                    ->label('Email address')
                    ->searchable(),
                TextColumn::make('message')
                    ->limit(60),
                TextColumn::make('created_at')
                    ->label('Received')
                    ->since()
                    ->sortable(),
            ])
            ->filters([
                TernaryFilter::make('read_at')
                    ->label('Read status')
                    ->nullable()
                    ->trueLabel('Read')
                    ->falseLabel('Unread'),
            ])
            ->recordActions([
                ViewAction::make(),
                Action::make('markAsRead')
                    ->label('Mark as read')
                    ->icon(Heroicon::OutlinedCheck)
                    ->visible(fn (ContactMessage $record) => $record->read_at === null)
                    ->action(fn (ContactMessage $record) => $record->markAsRead()),
                DeleteAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    BulkAction::make('markAsRead')
                        ->label('Mark as read')
                        ->icon(Heroicon::OutlinedCheck)
                        ->action(fn (Collection $records) => ContactMessage::query()
                            ->whereKey($records->modelKeys())
                            ->unread()
                            ->update(['read_at' => now()]))
                        ->deselectRecordsAfterCompletion(),
                    DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ManageContactMessages::route('/'),
        ];
    }
}
