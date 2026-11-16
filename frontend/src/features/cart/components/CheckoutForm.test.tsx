import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { CheckoutForm } from './CheckoutForm';

const setup = (props: Partial<Parameters<typeof CheckoutForm>[0]> = {}) => {
  const onSubmit = vi.fn();
  render(
    <MemoryRouter>
      <CheckoutForm submitting={false} onSubmit={onSubmit} onBack={vi.fn()} {...props} />
    </MemoryRouter>,
  );
  return { onSubmit, user: userEvent.setup() };
};

const fillValid = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText('Nombre completo'), 'Ana Torres');
  await user.type(screen.getByLabelText('Teléfono / WhatsApp'), '987 654 321');
  await user.type(screen.getByLabelText('Nota (opcional)'), 'Por la tarde');
};

describe('CheckoutForm', () => {
  it('exige nombre y teléfono válidos antes de enviar', async () => {
    const { onSubmit, user } = setup();
    await user.click(screen.getByRole('button', { name: /enviar pedido/i }));

    expect(await screen.findByText('Ingresa tu nombre')).toBeInTheDocument();
    expect(screen.getByText('Ingresa un número de teléfono válido')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('no envía sin aceptar la política de privacidad (casilla no premarcada)', async () => {
    const { onSubmit, user } = setup();
    await fillValid(user);

    expect(screen.getByRole('checkbox')).not.toBeChecked();
    await user.click(screen.getByRole('button', { name: /enviar pedido/i }));

    expect(await screen.findByText(/debes aceptar la política de privacidad/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('envía los datos del cliente cuando son válidos y hay consentimiento', async () => {
    const { onSubmit, user } = setup();
    await fillValid(user);
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /enviar pedido/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toEqual({
      customer_name: 'Ana Torres',
      customer_phone: '987 654 321',
      notes: 'Por la tarde',
      privacy_accepted: true,
      website: '',
    });
  });

  it('enlaza a la política de privacidad y a los términos', () => {
    setup();
    expect(screen.getByRole('link', { name: 'Política de privacidad' })).toHaveAttribute('href', '/privacidad');
    expect(screen.getByRole('link', { name: 'Términos y condiciones' })).toHaveAttribute('href', '/terminos');
  });

  it('muestra los errores que devuelve el servidor', () => {
    setup({ serverErrors: { customer_phone: ['El teléfono no es válido.'] } });
    expect(screen.getByText('El teléfono no es válido.')).toBeInTheDocument();
  });
});
