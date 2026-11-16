<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PromotionRequest;
use App\Http\Resources\Admin\PromotionResource;
use App\Models\Promotion;
use App\Services\Admin\PromotionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PromotionController extends Controller
{
    public function __construct(private readonly PromotionService $promotions) {}

    public function index(): AnonymousResourceCollection
    {
        return PromotionResource::collection(
            Promotion::query()->withCount(['products', 'categories'])->latest('starts_at')->paginate(20),
        );
    }

    public function show(Promotion $promotion): PromotionResource
    {
        return new PromotionResource($promotion->load(['products:id,name', 'categories:id']));
    }

    public function store(PromotionRequest $request): JsonResponse
    {
        $promotion = $this->promotions->create($request->validated(), $request->file('banner'));

        return (new PromotionResource($promotion->load(['products:id,name', 'categories:id'])))->response()->setStatusCode(201);
    }

    public function update(PromotionRequest $request, Promotion $promotion): PromotionResource
    {
        $promotion = $this->promotions->update($promotion, $request->validated(), $request->file('banner'));

        return new PromotionResource($promotion->load(['products:id,name', 'categories:id']));
    }

    public function destroy(Promotion $promotion): JsonResponse
    {
        $this->promotions->delete($promotion);

        return response()->json(null, 204);
    }
}
