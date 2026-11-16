<?php

use App\Exceptions\DomainRuleException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Sanctum SPA: autenticación por cookie de sesión + CSRF para el frontend.
        $middleware->statefulApi();

        // Detrás de un proxy/CDN: sin esto $request->ip() sería la IP del proxy y el rate limit no serviría.
        $middleware->replace(\Illuminate\Http\Middleware\TrustProxies::class, \App\Http\Middleware\TrustConfiguredProxies::class);

        $middleware->alias(['admin' => \App\Http\Middleware\EnsureAdmin::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->dontReport(DomainRuleException::class);

        $exceptions->shouldRenderJsonWhen(fn (Request $request) => $request->is('api/*') || $request->expectsJson());

        // Reglas de negocio violadas (stock insuficiente, transición inválida...) → 422 con detalle.
        $exceptions->render(fn (DomainRuleException $e) => response()->json([
            'message' => $e->getMessage(),
            'errors' => $e->errors(),
        ], 422));
    })->create();
