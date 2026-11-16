<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProductImageUploadRequest;
use App\Http\Resources\Admin\ProductImageResource;
use App\Models\Product;
use App\Models\ProductImage;
use App\Services\Admin\ProductImageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductImageController extends Controller
{
    public function __construct(private readonly ProductImageService $images) {}

    public function store(ProductImageUploadRequest $request, Product $product): JsonResponse
    {
        $created = $this->images->upload($product, $request->file('images'), $request->validated('color_id'));

        return ProductImageResource::collection($created)->response()->setStatusCode(201);
    }

    public function update(Request $request, Product $product, ProductImage $image): ProductImageResource
    {
        $data = $request->validate([
            'color_id' => ['nullable', 'integer', 'exists:colors,id'],
            'is_primary' => ['boolean'],
        ]);

        return new ProductImageResource($this->images->update($image, $data));
    }

    public function reorder(Request $request, Product $product): AnonymousResourceCollection
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct'],
        ]);

        $this->images->reorder($product, $data['ids']);

        return ProductImageResource::collection($product->images()->get());
    }

    public function destroy(Product $product, ProductImage $image): JsonResponse
    {
        $this->images->delete($image);

        return response()->json(null, 204);
    }
}
