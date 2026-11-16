<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Exceptions\DomainRuleException;
use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\OrderResource;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Services\Orders\OrderService;
use App\Services\Settings\SettingsRepository;
use App\Support\PhoneHash;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public function __construct(private readonly OrderService $orders) {}

    /** Listado + conteo por estado (para las pestañas) en la misma respuesta. */
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'status' => ['nullable', Rule::enum(OrderStatus::class)],
            'q' => ['nullable', 'string', 'max:60'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $base = Order::query()
            ->when($filters['q'] ?? null, function (Builder $query, string $q) {
                $digits = preg_replace('/\D+/', '', $q);
                $like = addcslashes($q, '%_\\');
                $query->where(function (Builder $w) use ($q, $like, $digits) {
                    $w->where('code', strtoupper($q))
                        ->orWhere('code', 'like', strtoupper($like).'%')
                        ->orWhere('customer_name', 'like', $like.'%');
                    // El teléfono está cifrado: se busca por número completo vía hash.
                    if (strlen($digits) >= 9) {
                        $w->orWhere(fn (Builder $p) => $p->phone($digits));
                    }
                });
            })
            ->when($filters['date_from'] ?? null, fn (Builder $q, $d) => $q->where('created_at', '>=', $d.' 00:00:00'))
            ->when($filters['date_to'] ?? null, fn (Builder $q, $d) => $q->where('created_at', '<=', $d.' 23:59:59'));

        $counts = (clone $base)->selectRaw('status, COUNT(*) as total')->groupBy('status')->pluck('total', 'status');

        $orders = $base
            ->when($filters['status'] ?? null, fn (Builder $q, $s) => $q->where('status', $s))
            ->withCount('items')
            ->latest('created_at')
            ->latest('id')
            ->paginate($filters['per_page'] ?? 20)
            ->withQueryString();

        return OrderResource::collection($orders)->additional([
            'counts' => collect(OrderStatus::cases())->mapWithKeys(fn (OrderStatus $s) => [$s->value => (int) ($counts[$s->value] ?? 0)]),
        ]);
    }

    public function show(Order $order): OrderResource
    {
        return new OrderResource($order->load(['items', 'histories.user:id,name', 'handler:id,name']));
    }

    public function confirm(Request $request, Order $order): OrderResource
    {
        $data = $request->validate(['comment' => ['nullable', 'string', 'max:500']]);
        $order = $this->orders->confirm($order, $request->user(), $data['comment'] ?? null);

        return new OrderResource($order->load(['items', 'histories.user:id,name', 'handler:id,name']));
    }

    public function cancel(Request $request, Order $order): OrderResource
    {
        $data = $request->validate(['comment' => ['nullable', 'string', 'max:500']]);
        $order = $this->orders->cancel($order, $request->user(), $data['comment'] ?? null);

        return new OrderResource($order->load(['items', 'histories.user:id,name', 'handler:id,name']));
    }

    /** ARCO – cancelación: borra los datos personales del pedido (solo pedidos cerrados). */
    public function anonymize(Request $request, Order $order): OrderResource
    {
        if ($order->status === OrderStatus::Pending) {
            throw new DomainRuleException('Confirma o cancela el pedido antes de anonimizarlo.', ['status' => ['El pedido sigue pendiente.']]);
        }

        $order->anonymize();
        OrderStatusHistory::query()->create([
            'order_id' => $order->id,
            'from_status' => $order->status,
            'to_status' => $order->status,
            'user_id' => $request->user()->id,
            'comment' => 'Datos personales anonimizados (solicitud ARCO).',
        ]);

        return new OrderResource($order->load(['items', 'histories.user:id,name', 'handler:id,name']));
    }

    /** ARCO – acceso: todos los datos que la tienda guarda de un teléfono, en JSON descargable. */
    public function export(Request $request): JsonResponse
    {
        $data = $request->validate(['phone' => ['required', 'string', 'regex:/^\+?[\d\s\-()]{7,20}$/']]);

        $orders = Order::query()->phone($data['phone'])->with('items')->oldest()->get();

        return response()->json([
            'generated_at' => now()->toIso8601String(),
            'data_controller' => app(SettingsRepository::class)->get('legal_name'),
            'phone' => PhoneHash::normalize($data['phone']),
            'orders' => $orders->map(fn (Order $o) => [
                'code' => $o->code,
                'created_at' => $o->created_at->toIso8601String(),
                'status' => $o->status->label(),
                'customer_name' => $o->customer_name,
                'customer_phone' => $o->customer_phone,
                'notes' => $o->notes,
                'total' => $o->total,
                'privacy_accepted_at' => $o->privacy_accepted_at?->toIso8601String(),
                'items' => $o->items->map(fn ($i) => "{$i->quantity} x {$i->product_name} ({$i->color_name} / {$i->size_name})"),
            ]),
        ], 200, ['Content-Disposition' => 'attachment; filename="datos-cliente.json"']);
    }
}
