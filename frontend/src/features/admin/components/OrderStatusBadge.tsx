import { Badge } from '@/shared/ui/Badge';
import type { OrderStatus } from '../types';

const config: Record<OrderStatus, { label: string; tone: 'amber' | 'sage' | 'red' }> = {
  pending: { label: 'Pendiente', tone: 'amber' },
  confirmed: { label: 'Venta confirmada', tone: 'sage' },
  cancelled: { label: 'No concretada', tone: 'red' },
};

export const ORDER_STATUS_LABELS = Object.fromEntries(Object.entries(config).map(([k, v]) => [k, v.label])) as Record<OrderStatus, string>;

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={config[status].tone}>{config[status].label}</Badge>;
}
