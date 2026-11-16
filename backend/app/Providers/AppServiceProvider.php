<?php

namespace App\Providers;

use App\Enums\PromotionType;
use App\Messaging\Contracts\OrderChannelLinkBuilder;
use App\Messaging\Contracts\OrderMessageFormatter;
use App\Messaging\WhatsAppLinkBuilder;
use App\Messaging\WhatsAppMessageFormatter;
use App\Pricing\CachedActivePromotionProvider;
use App\Pricing\Contracts\ActivePromotionProvider;
use App\Pricing\Contracts\PriceCalculator;
use App\Pricing\DiscountStrategyResolver;
use App\Pricing\PromotionPriceCalculator;
use App\Pricing\Strategies\FixedAmountDiscount;
use App\Pricing\Strategies\PercentageDiscount;
use App\Services\Catalog\CategoryTree;
use App\Services\Media\Contracts\ImageStorage;
use App\Services\Media\InterventionImageStorage;
use App\Services\Settings\SettingsRepository;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\ServiceProvider;
use Intervention\Image\Drivers\Gd\Driver as GdDriver;
use Intervention\Image\ImageManager;

class AppServiceProvider extends ServiceProvider
{
    /** Inversión de dependencias: los servicios dependen de contratos, aquí se elige la implementación. */
    public function register(): void
    {
        // "scoped": una instancia por petición → la memoización interna no se filtra entre peticiones.
        $this->app->scoped(CategoryTree::class);
        $this->app->scoped(SettingsRepository::class);
        $this->app->scoped(ActivePromotionProvider::class, CachedActivePromotionProvider::class);

        $this->app->singleton(DiscountStrategyResolver::class, fn () => new DiscountStrategyResolver([
            PromotionType::Percentage->value => new PercentageDiscount,
            PromotionType::Fixed->value => new FixedAmountDiscount,
        ]));

        $this->app->bind(PriceCalculator::class, PromotionPriceCalculator::class);
        $this->app->bind(OrderMessageFormatter::class, WhatsAppMessageFormatter::class);
        $this->app->bind(OrderChannelLinkBuilder::class, WhatsAppLinkBuilder::class);

        $this->app->bind(ImageStorage::class, fn () => new InterventionImageStorage(
            new ImageManager(new GdDriver),
            Storage::disk('public'),
        ));
    }

    public function boot(): void
    {
        // Cualquier carga perezosa (N+1) lanza excepción fuera de producción.
        Model::preventLazyLoading(! $this->app->isProduction());
        Model::preventSilentlyDiscardingAttributes(! $this->app->isProduction());

        JsonResource::withoutWrapping();

        RateLimiter::for('public', fn (Request $request) => Limit::perMinute(90)->by($request->ip()));
        RateLimiter::for('orders', fn (Request $request) => [
            Limit::perMinute(10)->by('m:'.$request->ip()),
            Limit::perDay(40)->by('d:'.$request->ip()),
        ]);
        RateLimiter::for('complaints', fn (Request $request) => Limit::perHour(5)->by($request->ip()));
        // Dos límites: por cuenta (fuerza bruta) y por IP (credential stuffing rotando correos).
        RateLimiter::for('login', fn (Request $request) => [
            Limit::perMinute(5)->by('e:'.$request->ip().'|'.mb_strtolower((string) $request->input('email'))),
            Limit::perMinute(20)->by('ip:'.$request->ip()),
        ]);
        RateLimiter::for('admin', fn (Request $request) => Limit::perMinute(180)->by('u:'.$request->user()?->id));
    }
}
