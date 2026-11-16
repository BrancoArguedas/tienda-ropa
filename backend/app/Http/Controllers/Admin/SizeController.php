<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SizeRequest;
use App\Models\Size;
use App\Services\Support\SafeDeleter;
use Illuminate\Http\JsonResponse;

class SizeController extends Controller
{
    public function store(SizeRequest $request): JsonResponse
    {
        $data = $request->validated();
        $size = Size::query()->create([...$data, 'position' => $data['position'] ?? 0]);

        return response()->json($size->only(['id', 'name', 'position']), 201);
    }

    public function update(SizeRequest $request, Size $size): JsonResponse
    {
        $size->update($request->validated());

        return response()->json($size->only(['id', 'name', 'position']));
    }

    public function destroy(Size $size, SafeDeleter $deleter): JsonResponse
    {
        $deleter->delete($size, 'Esta talla está en uso por uno o más productos.');

        return response()->json(null, 204);
    }
}
