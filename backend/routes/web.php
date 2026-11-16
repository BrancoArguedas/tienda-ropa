<?php

use App\Http\Controllers\SeoController;
use Illuminate\Support\Facades\Route;

/*
| Rutas públicas del SPA servidas con SEO real (head + contenido + JSON-LD).
| nginx envía aquí todo lo que no sea un archivo estático; el frontend sigue
| resolviendo la navegación con React Router una vez cargado.
*/
Route::get('/', [SeoController::class, 'home']);
Route::get('catalogo', [SeoController::class, 'catalog']);
Route::get('ofertas', [SeoController::class, 'sale']);
Route::get('categoria/{slug}', [SeoController::class, 'category']);
Route::get('producto/{slug}', [SeoController::class, 'product']);
Route::get('{page}', [SeoController::class, 'legal'])
    ->whereIn('page', ['privacidad', 'terminos', 'cookies', 'libro-de-reclamaciones']);

Route::get('robots.txt', [SeoController::class, 'robots']);
Route::get('sitemap.xml', [SeoController::class, 'sitemap']);

Route::get('admin/{any?}', [SeoController::class, 'admin'])->where('any', '.*');

// Cualquier otra ruta GET: 404 real (con el shell del SPA para que React muestre su página).
Route::fallback([SeoController::class, 'fallback']);
