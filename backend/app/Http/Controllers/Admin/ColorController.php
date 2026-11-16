<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ColorRequest;
use App\Models\Color;
use App\Services\Support\SafeDeleter;
use Illuminate\Http\JsonResponse;

class ColorController extends Controller
{
    public function store(ColorRequest $request): JsonResponse
    {
        $color = Color::query()->create([...$request->validated(), 'hex' => strtoupper($request->validated('hex'))]);

        return response()->json($color->only(['id', 'name', 'hex']), 201);
    }

    public function update(ColorRequest $request, Color $color): JsonResponse
    {
        $color->update([...$request->validated(), 'hex' => strtoupper($request->validated('hex'))]);

        return response()->json($color->only(['id', 'name', 'hex']));
    }

    public function destroy(Color $color, SafeDeleter $deleter): JsonResponse
    {
        $deleter->delete($color, 'Este color está en uso por uno o más productos.');

        return response()->json(null, 204);
    }
}
