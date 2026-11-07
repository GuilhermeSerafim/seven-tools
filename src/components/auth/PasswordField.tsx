import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PasswordFieldProps {
  id: string;
  label: string;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
  registration: object;
  showToggle?: boolean;
  visibilityState?: [boolean, () => void];
}

export function PasswordField({
  id,
  label,
  placeholder = '••••••••',
  autoComplete,
  error,
  registration,
  showToggle = true,
  visibilityState,
}: PasswordFieldProps) {
  const [localShow, setLocalShow] = useState(false);
  const show = visibilityState ? visibilityState[0] : localShow;
  const toggle = visibilityState ? visibilityState[1] : () => setLocalShow(v => !v);
  const errorId = `${id}-error`;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {showToggle ? (
        <div className="relative">
          <Input
            id={id}
            type={show ? 'text' : 'password'}
            placeholder={placeholder}
            autoComplete={autoComplete}
            {...registration}
            aria-describedby={error ? errorId : undefined}
            aria-invalid={error ? 'true' : undefined}
            className={`pr-10 ${error ? 'border-destructive' : ''}`}
          />
          <button
            type="button"
            aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={show}
            onClick={toggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      ) : (
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          autoComplete={autoComplete}
          {...registration}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? 'true' : undefined}
          className={error ? 'border-destructive' : ''}
        />
      )}
      {error && (
        <p id={errorId} className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
