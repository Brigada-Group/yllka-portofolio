<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" data-theme="dark">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="theme-color" content="#0e0e0f">

        {{-- Theme and motion choices before first paint: dark unless the visitor chose light (see resources/js/lib/theme.ts). --}}
        <script>
            (function () {
                var theme = 'dark';
                try { if (localStorage.getItem('theme') === 'light') theme = 'light'; } catch (e) {}
                document.documentElement.dataset.theme = theme;
                // The site's own "Reduce motion" toggle (see resources/js/lib/motion.ts).
                try { if (localStorage.getItem('motion') === 'reduce') document.documentElement.dataset.motion = 'reduce'; } catch (e) {}
                if (theme === 'light') document.querySelector('meta[name="theme-color"]').setAttribute('content', '#f3f1ec');
            })();
        </script>

        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@300..600&family=Geist+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap">

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ config('app.name', 'Laravel') }}</title>
        </x-inertia::head>
    </head>
    <body class="bg-background text-foreground antialiased">
        <x-inertia::app />
    </body>
</html>
