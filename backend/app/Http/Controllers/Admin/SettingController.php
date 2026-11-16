<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SettingsRequest;
use App\Services\Settings\SettingsRepository;
use Illuminate\Http\JsonResponse;

class SettingController extends Controller
{
    public function __construct(private readonly SettingsRepository $settings) {}

    public function show(): JsonResponse
    {
        return response()->json($this->settings->all());
    }

    public function update(SettingsRequest $request): JsonResponse
    {
        $this->settings->update($request->validated());

        return response()->json($this->settings->all());
    }
}
