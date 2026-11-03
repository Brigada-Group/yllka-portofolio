<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        @if ($page['component'] === 'home')
            {{-- Hide the hero text before first paint when the orb intro will reveal it. Mirrors shouldPlayIntro() in resources/js/components/orb/intro.ts. --}}
            <script>
                try {
                    if (!sessionStorage.getItem('orb-intro-played') && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
                        document.documentElement.classList.add('orb-intro');
                    }
                } catch (e) {}
            </script>
        @endif

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ config('app.name', 'Laravel') }}</title>
        </x-inertia::head>
    </head>
    <body>
        <x-inertia::app />
    </body>
</html>
