<?php

namespace App\Services\Admin;

use App\Models\Promotion;
use App\Pricing\Contracts\ActivePromotionProvider;
use App\Services\Media\Contracts\ImageStorage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class PromotionService
{
    public const BANNER_WIDTH = 1600;

    public function __construct(
        private readonly ImageStorage $storage,
        private readonly ActivePromotionProvider $promotions,
    ) {}

    public function create(array $data, ?UploadedFile $banner): Promotion
    {
        return $this->save(new Promotion, $data, $banner);
    }

    public function update(Promotion $promotion, array $data, ?UploadedFile $banner): Promotion
    {
        return $this->save($promotion, $data, $banner);
    }

    public function delete(Promotion $promotion): void
    {
        $banner = $promotion->banner_path;
        $promotion->delete();
        $this->deleteBanner($banner);
        $this->promotions->flush();
    }

    private function save(Promotion $promotion, array $data, ?UploadedFile $banner): Promotion
    {
        $newBanner = $banner
            ? $this->storage->store($banner, 'promotions', [self::BANNER_WIDTH]).'-'.self::BANNER_WIDTH.'.webp'
            : null;
        $oldBanner = $promotion->banner_path;
        $removeBanner = ! empty($data['remove_banner']);

        try {
            DB::transaction(function () use ($promotion, $data, $newBanner, $removeBanner) {
                $promotion->fill([
                    'name' => $data['name'],
                    'description' => $data['description'] ?? null,
                    'type' => $data['type'],
                    'value' => $data['value'],
                    'starts_at' => $data['starts_at'],
                    'ends_at' => $data['ends_at'],
                    'is_active' => (bool) ($data['is_active'] ?? true),
                ]);
                if ($newBanner) {
                    $promotion->banner_path = $newBanner;
                } elseif ($removeBanner) {
                    $promotion->banner_path = null;
                }
                $promotion->save();

                $promotion->products()->sync($data['product_ids'] ?? []);
                $promotion->categories()->sync($data['category_ids'] ?? []);
            });
        } catch (\Throwable $e) {
            $this->deleteBanner($newBanner);
            throw $e;
        }

        if ($oldBanner && ($newBanner || $removeBanner)) {
            $this->deleteBanner($oldBanner);
        }

        // Los pivotes no disparan eventos del modelo: se invalida la caché explícitamente.
        $this->promotions->flush();

        return $promotion;
    }

    private function deleteBanner(?string $path): void
    {
        if ($path) {
            $this->storage->delete(str_replace('-'.self::BANNER_WIDTH.'.webp', '', $path), [self::BANNER_WIDTH]);
        }
    }
}
