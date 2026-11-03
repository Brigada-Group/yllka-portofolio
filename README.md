# Portfolio

Laravel 13 · Inertia 3 + React 19 + TypeScript · Tailwind 4 · Filament 5 (admin at `/admin`) · SQLite.

## Setup

```bash
composer setup            # install deps, .env, key, migrate, build assets
# set ADMIN_EMAIL / ADMIN_PASSWORD in .env
php artisan migrate:fresh --seed
php artisan storage:link
composer run dev          # server :8000, queue, logs, vite
```

## Checks

```bash
composer test             # pint, larastan, pest
npm run check && npm run types:check
```

## Where things are

- Public pages: `resources/js/pages`, layout in `resources/js/layouts/public-layout.tsx`, shared bits in `resources/js/components`
- Model types for props: `resources/js/types/models.ts` (keep in sync with `app/Models`)
- Controllers: `app/Http/Controllers`; site settings shared in `HandleInertiaRequests`
- Admin: `app/Filament` (resources + `Pages/ManageSiteSettings.php`)
- Site settings: `app/Settings/SiteSettings.php` (spatie/laravel-settings), defaults in `database/settings`
- Demo content: `database/seeders/PortfolioSeeder.php`
