<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Http\Requests\Store\PlaceOrderRequest;
use App\Http\Resources\Store\PlacedOrderResource;
use App\Services\Orders\OrderService;
use App\Services\Orders\PlaceOrderData;
use Illuminate\Http\JsonResponse;

class OrderController extends Controller
{
    public function store(PlaceOrderRequest $request, OrderService $orders): JsonResponse
    {
        $placed = $orders->place(PlaceOrderData::fromArray($request->validated()));

        return (new PlacedOrderResource($placed))->response()->setStatusCode(201);
    }
}
