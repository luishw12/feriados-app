import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

interface Props {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function FormSelect({
  id,
  value,
  onValueChange,
  options,
  placeholder = 'Selecione…',
  required = false,
  disabled = false,
  className,
}: Props) {
  return (
    <div className={cn('relative', className)}>
      {required && (
        <input
          tabIndex={-1}
          aria-hidden="true"
          className="pointer-events-none absolute size-0 opacity-0"
          value={value}
          required={value.length === 0}
          readOnly
          name={`${id}-validation`}
        />
      )}
      <Select
        value={value.length > 0 ? value : undefined}
        onValueChange={onValueChange}
        disabled={disabled}
        required={required}
      >
        <SelectTrigger id={id} className="h-9 w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
