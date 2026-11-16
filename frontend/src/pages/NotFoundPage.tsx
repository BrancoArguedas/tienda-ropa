import { Link } from 'react-router-dom';
import { EmptyState } from '@/shared/ui/EmptyState';

export function NotFoundPage() {
  return (
    <div className="container-page py-16">
      <EmptyState
        title="Página no encontrada"
        description="El enlace que seguiste no existe o fue movido."
        action={<Link to="/" className="text-sm font-medium underline underline-offset-4">Volver al inicio</Link>}
      />
    </div>
  );
}
