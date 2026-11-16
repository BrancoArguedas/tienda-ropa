import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useCurrentAdmin, useLogin } from '@/features/admin/auth/useAuth';
import { getApiError } from '@/shared/api/httpClient';
import { Button } from '@/shared/ui/Button';
import { Field, Input } from '@/shared/ui/Field';

const schema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
});
type Values = z.infer<typeof schema>;

export default function LoginPage() {
  const { data: user } = useCurrentAdmin();
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/admin';
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  if (user) return <Navigate to={from} replace />;

  const apiError = login.error ? getApiError(login.error) : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream p-4">
      <form
        onSubmit={handleSubmit((values) => login.mutate(values, { onSuccess: () => navigate(from, { replace: true }) }))}
        className="card w-full max-w-sm space-y-5 p-8"
        noValidate
      >
        <div>
          <h1 className="text-3xl">Panel de administración</h1>
          <p className="mt-1 text-sm text-ink-muted">Ingresa para gestionar tu tienda.</p>
        </div>
        <Field label="Correo" htmlFor="email" error={errors.email?.message ?? apiError?.errors?.email?.[0]}>
          <Input id="email" type="email" autoComplete="username" {...register('email')} />
        </Field>
        <Field label="Contraseña" htmlFor="password" error={errors.password?.message}>
          <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
        </Field>
        {apiError && !apiError.errors?.email && <p className="text-sm text-red-700">{apiError.message}</p>}
        <Button type="submit" fullWidth size="lg" loading={login.isPending}>Ingresar</Button>
      </form>
    </div>
  );
}
