import { Icon } from '@/shared/ui/Icon';

interface QuantityStepperProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  label?: string;
}

export function QuantityStepper({ value, max, onChange, label = 'Cantidad' }: QuantityStepperProps) {
  return (
    <div className="inline-flex items-center rounded-full border border-cream-300 bg-white" role="group" aria-label={label}>
      <button type="button" className="p-2 disabled:opacity-30" onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Disminuir">
        <Icon name="minus" className="h-4 w-4" />
      </button>
      <span className="w-7 text-center text-sm font-medium tabular-nums" aria-live="polite">{value}</span>
      <button type="button" className="p-2 disabled:opacity-30" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Aumentar">
        <Icon name="plus" className="h-4 w-4" />
      </button>
    </div>
  );
}
