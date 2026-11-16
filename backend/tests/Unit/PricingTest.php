<?php

use App\Filters\Product\SearchFilter;
use App\Pricing\Strategies\FixedAmountDiscount;
use App\Pricing\Strategies\PercentageDiscount;
use App\Support\Money;

it('calcula descuentos porcentuales en céntimos sin errores de coma flotante', function () {
    expect((new PercentageDiscount)->discountCents(11990, '20'))->toBe(2398)
        ->and((new PercentageDiscount)->discountCents(1000, '150'))->toBe(1000);
});

it('nunca descuenta un monto fijo mayor al precio', function () {
    expect((new FixedAmountDiscount)->discountCents(5000, '10.00'))->toBe(1000)
        ->and((new FixedAmountDiscount)->discountCents(500, '10.00'))->toBe(500);
});

it('convierte montos entre decimales y céntimos', function () {
    expect(Money::toCents('19.99'))->toBe(1999)
        ->and(Money::fromCents(1999))->toBe('19.99')
        ->and(Money::toCents('0.1') + Money::toCents('0.2'))->toBe(30);
});

it('limpia operadores del modo booleano en la búsqueda', function () {
    expect(SearchFilter::toBooleanQuery('vestido  +rojo -(x)'))->toBe('+vestido* +rojo*')
        ->and(SearchFilter::toBooleanQuery('a'))->toBe('');
});
