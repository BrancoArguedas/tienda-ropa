<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Color;
use App\Models\Size;
use Illuminate\Http\JsonResponse;

/** Catálogos auxiliares para los formularios del admin en UNA llamada (incluye inactivos). */
class CatalogOptionsController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'categories' => Category::query()->orderBy('position')->orderBy('name')->get(['id', 'parent_id', 'name', 'is_active']),
            'sizes' => Size::query()->orderBy('position')->get(['id', 'name', 'position']),
            'colors' => Color::query()->orderBy('name')->get(['id', 'name', 'hex']),
        ]);
    }
}
