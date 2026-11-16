<?php

namespace App\Http\Controllers\Admin;

use App\Exceptions\DomainRuleException;
use App\Http\Controllers\Controller;
use App\Models\Complaint;
use App\Services\Complaints\ComplaintService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class ComplaintController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'status' => ['nullable', 'in:pending,answered'],
            'q' => ['nullable', 'string', 'max:60'],
        ]);

        /** @var LengthAwarePaginator $page */
        $page = Complaint::query()
            ->when($filters['status'] ?? null, fn (Builder $q, $s) => $q->where('status', $s))
            ->when($filters['q'] ?? null, function (Builder $q, string $term) {
                $like = addcslashes($term, '%_\\');
                $q->where(fn (Builder $w) => $w->where('number', 'like', '%'.$like.'%')
                    ->orWhere('consumer_name', 'like', $like.'%')
                    ->orWhere('document_number', $term));
            })
            // Pendientes primero, por vencimiento más próximo.
            ->orderByRaw("status = 'answered'")
            ->orderBy('due_at')
            ->latest('id')
            ->paginate(20);

        return response()->json([
            'data' => collect($page->items())->map(fn (Complaint $c) => $this->summary($c)),
            'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total()],
            'counts' => [
                'pending' => Complaint::query()->where('status', 'pending')->count(),
                'overdue' => Complaint::query()->where('status', 'pending')->whereDate('due_at', '<', today())->count(),
            ],
        ]);
    }

    public function show(Complaint $complaint): JsonResponse
    {
        $complaint->loadMissing('answeredBy:id,name');

        return response()->json([
            ...$this->summary($complaint),
            'document_type' => $complaint->document_type,
            'document_number' => $complaint->document_number,
            'address' => $complaint->address,
            'phone' => $complaint->phone,
            'email' => $complaint->email,
            'is_minor' => $complaint->is_minor,
            'guardian_name' => $complaint->guardian_name,
            'item_type' => $complaint->item_type,
            'item_type_label' => $complaint->itemTypeLabel(),
            'amount' => $complaint->amount,
            'item_description' => $complaint->item_description,
            'order_code' => $complaint->order_code,
            'detail' => $complaint->detail,
            'consumer_request' => $complaint->consumer_request,
            'provider_response' => $complaint->provider_response,
            'answered_by' => $complaint->answeredBy?->name,
        ]);
    }

    public function answer(Request $request, Complaint $complaint, ComplaintService $complaints): JsonResponse
    {
        $data = $request->validate(['response' => ['required', 'string', 'min:10', 'max:5000']]);

        if ($complaint->status === 'answered') {
            throw new DomainRuleException('Esta hoja ya fue respondida.', ['response' => ['La hoja ya tiene respuesta.']]);
        }

        $complaints->answer($complaint, $request->user(), $data['response']);

        return $this->show($complaint->refresh()->load('answeredBy:id,name'));
    }

    private function summary(Complaint $c): array
    {
        return [
            'id' => $c->id,
            'number' => $c->number,
            'type' => $c->type,
            'type_label' => $c->typeLabel(),
            'consumer_name' => $c->consumer_name,
            'status' => $c->status,
            'due_at' => $c->due_at->toDateString(),
            'overdue' => $c->status === 'pending' && $c->due_at->lt(today()),
            'created_at' => $c->created_at->toIso8601String(),
            'answered_at' => $c->answered_at?->toIso8601String(),
        ];
    }
}
