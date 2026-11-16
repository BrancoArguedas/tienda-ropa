<?php

namespace Database\Seeders;

use App\Enums\PromotionType;
use App\Models\Category;
use App\Models\Color;
use App\Models\Product;
use App\Models\Promotion;
use App\Models\Size;
use App\Services\Admin\ProductImageService;
use App\Services\Admin\ProductService;
use App\Services\Media\Contracts\ImageStorage;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Intervention\Image\Drivers\Gd\Driver as GdDriver;
use Intervention\Image\ImageManager;

/** Catálogo de demostración con imágenes generadas (sin depender de internet). */
class CatalogSeeder extends Seeder
{
    public function run(ProductService $products, ImageStorage $storage): void
    {
        $sizes = collect(['XS', 'S', 'M', 'L', 'XL'])
            ->mapWithKeys(fn (string $name, int $i) => [$name => Size::query()->firstOrCreate(['name' => $name], ['position' => $i])]);

        $colors = collect([
            'Negro' => '#1F1F1F', 'Blanco' => '#F5F2EC', 'Beige' => '#D9C4A3', 'Terracota' => '#C2603E',
            'Verde oliva' => '#6B7445', 'Azul marino' => '#22304A', 'Rosa palo' => '#E3B5B0', 'Mostaza' => '#D4A23A',
        ])->map(fn (string $hex, string $name) => Color::query()->firstOrCreate(['name' => $name], ['hex' => $hex]));

        $tree = [
            'Mujer' => ['Vestidos', 'Blusas', 'Pantalones', 'Faldas'],
            'Hombre' => ['Camisas', 'Polos', 'Jeans'],
            'Accesorios' => [],
        ];
        $categories = [];
        $position = 0;
        foreach ($tree as $parentName => $children) {
            $parent = Category::query()->firstOrCreate(['slug' => Str::slug($parentName)], ['name' => $parentName, 'position' => $position++]);
            $categories[$parentName] = $parent;
            foreach ($children as $i => $childName) {
                $slug = Str::slug("{$parentName} {$childName}");
                $categories["{$parentName}/{$childName}"] = Category::query()->firstOrCreate(
                    ['slug' => $slug],
                    ['name' => $childName, 'parent_id' => $parent->id, 'position' => $i],
                );
            }
        }

        $catalog = [
            ['Mujer/Vestidos', 'Vestido midi de lino', 159.90, ['Beige', 'Terracota'], true],
            ['Mujer/Vestidos', 'Vestido camisero a rayas', 139.90, ['Azul marino', 'Blanco'], false],
            ['Mujer/Vestidos', 'Vestido largo satinado', 219.00, ['Negro', 'Verde oliva'], true],
            ['Mujer/Vestidos', 'Vestido corto de punto', 119.90, ['Rosa palo', 'Mostaza'], false],
            ['Mujer/Blusas', 'Blusa de seda con lazo', 99.90, ['Blanco', 'Rosa palo'], true],
            ['Mujer/Blusas', 'Blusa campesina bordada', 89.90, ['Blanco', 'Terracota'], false],
            ['Mujer/Blusas', 'Top acanalado básico', 49.90, ['Negro', 'Beige', 'Blanco'], false],
            ['Mujer/Pantalones', 'Pantalón palazzo fluido', 129.90, ['Negro', 'Beige'], false],
            ['Mujer/Pantalones', 'Pantalón sastre de pinzas', 149.90, ['Azul marino', 'Negro'], true],
            ['Mujer/Faldas', 'Falda plisada midi', 109.90, ['Verde oliva', 'Mostaza'], false],
            ['Mujer/Faldas', 'Falda de jean recta', 89.90, ['Azul marino'], false],
            ['Hombre/Camisas', 'Camisa de lino manga larga', 139.90, ['Blanco', 'Beige'], true],
            ['Hombre/Camisas', 'Camisa oxford clásica', 119.90, ['Azul marino', 'Blanco'], false],
            ['Hombre/Polos', 'Polo piqué de algodón', 69.90, ['Negro', 'Blanco', 'Verde oliva'], false],
            ['Hombre/Polos', 'Polo oversize estampado', 59.90, ['Mostaza', 'Negro'], false],
            ['Hombre/Jeans', 'Jean slim fit', 149.90, ['Azul marino', 'Negro'], true],
            ['Hombre/Jeans', 'Jean recto vintage', 159.90, ['Azul marino'], false],
            ['Accesorios', 'Bolso tote de cuero', 189.90, ['Terracota', 'Negro'], true],
            ['Accesorios', 'Pañuelo de seda estampado', 45.90, ['Rosa palo', 'Mostaza'], false],
            ['Accesorios', 'Cinturón trenzado', 39.90, ['Beige', 'Negro'], false],
        ];

        $images = new ImageManager(new GdDriver);
        $sizeNames = ['XS', 'S', 'M', 'L', 'XL'];

        foreach ($catalog as $index => [$categoryKey, $name, $price, $colorNames, $featured]) {
            if (Product::query()->withTrashed()->where('name', $name)->exists()) {
                continue;
            }

            $variantSizes = $categoryKey === 'Accesorios' ? ['M'] : $sizeNames;
            $variants = [];
            foreach ($colorNames as $colorName) {
                foreach ($variantSizes as $sizeName) {
                    $variants[] = [
                        'size_id' => $sizes[$sizeName]->id,
                        'color_id' => $colors[$colorName]->id,
                        // Algunas combinaciones agotadas para mostrar tallas deshabilitadas.
                        'stock' => ($index + strlen($sizeName) + strlen($colorName)) % 5 === 0 ? 0 : random_int(1, 12),
                    ];
                }
            }

            $product = $products->create([
                'category_id' => $categories[$categoryKey]->id,
                'name' => $name,
                'description' => "{$name} confeccionado con materiales de calidad. Corte cómodo y moderno, ideal para el día a día o para una ocasión especial. Lavar a mano o en ciclo delicado.",
                'base_price' => $price,
                'is_active' => true,
                'is_featured' => $featured,
                'variants' => $variants,
            ]);

            foreach ($colorNames as $i => $colorName) {
                $binary = (string) $images->create(900, 1200)
                    ->fill($colors[$colorName]->hex)
                    ->drawRectangle(120, 160, fn ($r) => $r->size(660, 880)->background('rgba(255,255,255,0.18)'))
                    ->drawEllipse(450, 600, fn ($e) => $e->size(320, 320)->background('rgba(255,255,255,0.25)'))
                    ->toPng();

                $product->images()->create([
                    'color_id' => $colors[$colorName]->id,
                    'path' => $storage->store($binary, "products/{$product->id}", ProductImageService::WIDTHS),
                    'position' => $i + 1,
                    'is_primary' => $i === 0,
                ]);
            }
        }

        if (! Promotion::query()->exists()) {
            $banner = (string) $images->create(1600, 600)->fill('#C2603E')
                ->drawEllipse(1300, 300, fn ($e) => $e->size(700, 700)->background('rgba(255,255,255,0.15)'))
                ->toPng();

            $summer = Promotion::query()->create([
                'name' => 'Temporada de vestidos',
                'description' => '20% de descuento en todos los vestidos',
                'type' => PromotionType::Percentage,
                'value' => 20,
                'starts_at' => now()->subDay(),
                'ends_at' => now()->addMonth(),
                'is_active' => true,
                'banner_path' => $storage->store($banner, 'promotions', [1600]).'-1600.webp',
            ]);
            $summer->categories()->sync([$categories['Mujer/Vestidos']->id]);

            $polo = Promotion::query()->create([
                'name' => 'Polos a precio especial',
                'type' => PromotionType::Fixed,
                'value' => 10,
                'starts_at' => now()->subDay(),
                'ends_at' => now()->addWeeks(2),
                'is_active' => true,
            ]);
            $polo->products()->sync(Product::query()->where('category_id', $categories['Hombre/Polos']->id)->pluck('id'));
        }
    }
}
