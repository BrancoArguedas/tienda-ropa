<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CategoryRequest;
use App\Http\Resources\Admin\CategoryResource;
use App\Models\Category;
use App\Services\Support\SafeDeleter;
use App\Services\Support\SlugGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CategoryController extends Controller
{
    public function __construct(private readonly SlugGenerator $slugs) {}

    public function index(): AnonymousResourceCollection
    {
        return CategoryResource::collection(
            Category::query()->withCount('products')->orderBy('parent_id')->orderBy('position')->orderBy('name')->get(),
        );
    }

    public function store(CategoryRequest $request): JsonResponse
    {
        $data = $request->validated();
        $category = Category::query()->create([
            ...$data,
            'slug' => $this->slugs->unique(Category::class, $data['name']),
            'position' => $data['position'] ?? 0,
        ]);

        return (new CategoryResource($category))->response()->setStatusCode(201);
    }

    public function update(CategoryRequest $request, Category $category): CategoryResource
    {
        $data = $request->validated();
        if ($data['name'] !== $category->name) {
            $data['slug'] = $this->slugs->unique(Category::class, $data['name'], $category->id);
        }
        $category->update($data);

        return new CategoryResource($category);
    }

    public function destroy(Category $category, SafeDeleter $deleter): JsonResponse
    {
        $deleter->delete($category, 'La categoría tiene productos o subcategorías asociadas. Desactívala en lugar de eliminarla.');

        return response()->json(null, 204);
    }
}
