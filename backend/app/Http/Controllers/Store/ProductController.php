<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Http\Requests\Store\ProductIndexRequest;
use App\Http\Resources\Store\ProductCardResource;
use App\Http\Resources\Store\ProductDetailResource;
use App\Http\Resources\Store\ProductSuggestionResource;
use App\Services\Catalog\ProductQueryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductController extends Controller
{
    public function __construct(private readonly ProductQueryService $products) {}

    public function index(ProductIndexRequest $request): AnonymousResourceCollection
    {
        $validated = $request->validated();

        return ProductCardResource::collection(
            $this->products->paginate($validated, (int) ($validated['per_page'] ?? 24)),
        );
    }

    public function suggest(Request $request): JsonResponse
    {
        $term = trim((string) $request->query('q', ''));
        if (mb_strlen($term) < 2 || mb_strlen($term) > 100) {
            return response()->json(['products' => [], 'categories' => []]);
        }

        $result = $this->products->suggest($term);

        return response()->json([
            'products' => ProductSuggestionResource::collection($result['products']),
            'categories' => $result['categories'],
        ]);
    }

    public function show(string $slug): ProductDetailResource
    {
        return new ProductDetailResource($this->products->findBySlug($slug));
    }
}
