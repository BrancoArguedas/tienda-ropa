<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Http\Requests\Store\ComplaintRequest;
use App\Services\Complaints\ComplaintService;
use Illuminate\Http\JsonResponse;

class ComplaintController extends Controller
{
    public function store(ComplaintRequest $request, ComplaintService $complaints): JsonResponse
    {
        $complaint = $complaints->register($request->validated());

        // Solo lo necesario para la constancia en pantalla; nada de datos de otras hojas.
        return response()->json([
            'number' => $complaint->number,
            'created_at' => $complaint->created_at->toIso8601String(),
            'due_at' => $complaint->due_at->toDateString(),
            'email' => $complaint->email,
        ], 201);
    }
}
