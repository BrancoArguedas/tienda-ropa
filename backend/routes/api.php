<?php

use App\Http\Controllers\Admin;
use App\Http\Controllers\Store;
use Illuminate\Support\Facades\Route;

/*
| Tienda pública
*/
Route::middleware('throttle:public')->group(function () {
    Route::get('store', [Store\CatalogController::class, 'store']);
    Route::get('home', [Store\CatalogController::class, 'home']);
    Route::get('catalog/filters', [Store\CatalogController::class, 'filters']);
    Route::get('products', [Store\ProductController::class, 'index']);
});
// Antes de products/{slug} para que "suggest" no se tome como slug.
Route::get('products/suggest', [Store\ProductController::class, 'suggest'])->middleware('throttle:120,1');
Route::get('products/{slug}', [Store\ProductController::class, 'show'])->middleware('throttle:public');
Route::post('orders', [Store\OrderController::class, 'store'])->middleware('throttle:orders');
Route::post('complaints', [Store\ComplaintController::class, 'store'])->middleware('throttle:complaints');

/*
| Panel de administración (Sanctum SPA: cookie de sesión + CSRF)
*/
Route::prefix('admin')->group(function () {
    Route::post('login', [Admin\AuthController::class, 'login'])->middleware('throttle:login');

    Route::middleware(['auth:sanctum', 'admin', 'throttle:admin'])->group(function () {
        Route::get('me', [Admin\AuthController::class, 'me']);
        Route::post('logout', [Admin\AuthController::class, 'logout']);

        Route::get('dashboard', Admin\DashboardController::class);
        Route::get('catalog-options', Admin\CatalogOptionsController::class);

        Route::apiResource('categories', Admin\CategoryController::class)->except('show');
        Route::apiResource('sizes', Admin\SizeController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('colors', Admin\ColorController::class)->only(['store', 'update', 'destroy']);

        Route::apiResource('products', Admin\ProductController::class)->withTrashed(['show']);
        Route::post('products/{product}/images', [Admin\ProductImageController::class, 'store']);
        Route::put('products/{product}/images/reorder', [Admin\ProductImageController::class, 'reorder']);
        Route::patch('products/{product}/images/{image}', [Admin\ProductImageController::class, 'update'])->scopeBindings();
        Route::delete('products/{product}/images/{image}', [Admin\ProductImageController::class, 'destroy'])->scopeBindings();

        Route::apiResource('promotions', Admin\PromotionController::class)->except('update');
        // POST para la edición: los formularios multipart (banner) no viajan bien con PUT.
        Route::post('promotions/{promotion}', [Admin\PromotionController::class, 'update']);

        Route::get('orders', [Admin\OrderController::class, 'index']);
        // Derechos ARCO: acceso (exportar) y cancelación (anonimizar).
        Route::get('orders/export', [Admin\OrderController::class, 'export']);
        Route::get('orders/{order}', [Admin\OrderController::class, 'show']);
        Route::patch('orders/{order}/confirm', [Admin\OrderController::class, 'confirm']);
        Route::patch('orders/{order}/cancel', [Admin\OrderController::class, 'cancel']);
        Route::patch('orders/{order}/anonymize', [Admin\OrderController::class, 'anonymize']);

        Route::get('complaints', [Admin\ComplaintController::class, 'index']);
        Route::get('complaints/{complaint}', [Admin\ComplaintController::class, 'show']);
        Route::patch('complaints/{complaint}/answer', [Admin\ComplaintController::class, 'answer']);

        Route::get('settings', [Admin\SettingController::class, 'show']);
        Route::put('settings', [Admin\SettingController::class, 'update']);
    });
});
