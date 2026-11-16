<?php

namespace App\Services\Support;

use App\Exceptions\DomainRuleException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\QueryException;

/** Elimina un registro y traduce una violación de FK (RESTRICT) en un error de negocio legible. */
class SafeDeleter
{
    public function delete(Model $model, string $inUseMessage): void
    {
        try {
            $model->delete();
        } catch (QueryException $e) {
            // 23000 = violación de integridad referencial
            if ((string) $e->getCode() === '23000') {
                throw new DomainRuleException($inUseMessage, ['id' => [$inUseMessage]]);
            }
            throw $e;
        }
    }
}
