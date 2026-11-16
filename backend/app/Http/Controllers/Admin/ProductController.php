<?php

namespace App\Http\Controllers\Admin;

use App\Filters\Product\SearchFilter;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProductRequest;
use App\Http\Resources\Admin\ProductListResource;
use App\Http\Resources\Admin\ProductResource;
use App\Models\Product;
use App\Services\Admin\ProductService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductController extends Controller
{
    public function __construct(private readonly ProductService $products) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'category_id' => ['nullable', 'integer'],
            'status' => ['nullable', 'in:active,inactive'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $q = trim((string) $request->query('q', ''));
        $booleanQuery = SearchFilter::toBooleanQuery($q);

        $products = Product::query()
            ->select(['id', 'category_id', 'name', 'slug', 'base_price', 'is_active', 'is_featured', 'updated_at'])
            ->with(['category:id,name', 'primaryImage'])
            ->withSum('variants as stock_total', 'stock')
            ->withCount('variants')
            ->when($q !== '', fn (Builder $query) => $query->where(function (Builder $w) use ($q, $booleanQuery) {
                if ($booleanQuery !== '') {
                    $w->whereFullText(['name', 'description'], $booleanQuery, ['mode' => 'boolean']);
                }
                $w->orWhereHas('variants', fn (Builder $v) => $v->where('sku', 'like', $q.'%'));
            }))
            ->when($request->filled('category_id'), fn (Builder $query) => $query->where('category_id', $request->integer('category_id')))
            ->when($request->query('status') === 'active', fn (Builder $query) => $query->where('is_active', true))
            ->when($request->query('status') === 'inactive', fn (Builder $query) => $query->where('is_active', false))
            ->latest('id')
            ->paginate($request->integer('per_page', 20))
            ->withQueryString();

        return ProductListResource::collection($products);
    }

    public function show(Product $product): ProductResource
    {
        return new ProductResource($product->load(['variants', 'images']));
    }

    public function store(ProductRequest $request): JsonResponse
    {
        $product = $this->products->create($request->validated());

        return (new ProductResource($product->load(['variants', 'images'])))->response()->setStatusCode(201);
    }

    public function update(ProductRequest $request, Product $product): ProductResource
    {
        $product = $this->products->update($product, $request->validated());

        return new ProductResource($product->load(['variants', 'images']));
    }

    public function destroy(Product $product): JsonResponse
    {
        $this->products->delete($product);

        return response()->json(null, 204);
    }
}
