<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Http\Resources\Store\ProductCardResource;
use App\Http\Resources\Store\PromotionBannerResource;
use App\Services\Catalog\CatalogFilterService;
use App\Services\Catalog\ProductQueryService;
use App\Services\Settings\SettingsRepository;
use Illuminate\Http\JsonResponse;

class CatalogController extends Controller
{
    /** Ajustes públicos de la tienda (nombre, redes, moneda, guía de tallas). */
    public function store(SettingsRepository $settings): JsonResponse
    {
        $all = $settings->all();

        return response()->json([
            'store_name' => $all['store_name'],
            'store_tagline' => $all['store_tagline'],
            'currency_code' => $all['currency_code'],
            'locale' => $all['locale'],
            'instagram_url' => $all['instagram_url'],
            'facebook_url' => $all['facebook_url'],
            'tiktok_url' => $all['tiktok_url'],
            'address' => $all['address'],
            'size_guide' => $all['size_guide'],
            // Datos del titular para las páginas legales (claims_email es interno, no se publica).
            'legal' => [
                'legal_name' => $all['legal_name'],
                'ruc' => $all['ruc'],
                'legal_address' => $all['legal_address'],
                'privacy_email' => $all['privacy_email'],
                'data_retention_months' => (int) $all['data_retention_months'],
                'privacy_policy_version' => config('app.privacy_policy_version'),
            ],
        ]);
    }

    public function filters(CatalogFilterService $filters): JsonResponse
    {
        return response()->json($filters->get());
    }

    public function home(ProductQueryService $products): JsonResponse
    {
        $home = $products->home();

        return response()->json([
            'featured' => ProductCardResource::collection($home['featured']),
            'newest' => ProductCardResource::collection($home['newest']),
            'promotions' => PromotionBannerResource::collection($home['promotions']),
        ]);
    }
}
