<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Se lanza cuando una operación viola una regla de negocio
 * (stock insuficiente, transición de estado inválida, etc.).
 * Se renderiza como 422 en bootstrap/app.php.
 */
class DomainRuleException extends RuntimeException
{
    /** @param array<string, list<string>> $errors */
    public function __construct(string $message, private readonly array $errors = [])
    {
        parent::__construct($message);
    }

    /** @return array<string, list<string>> */
    public function errors(): array
    {
        return $this->errors;
    }
}
