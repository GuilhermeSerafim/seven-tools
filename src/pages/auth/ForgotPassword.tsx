import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import authService from '@/auth/authService';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const SAFE_CONFIRMATION_MESSAGE =
  'Se este e-mail estiver cadastrado, enviaremos instruções para redefinir sua senha.';
const GENERIC_ERROR_MESSAGE =
  'Não foi possível enviar as instruções agora. Tente novamente.';

const schema = z.object({
  email: z.string().email('Informe um e-mail válido'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPassword() {
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setHasSubmitted(false);
    setServerError('');

    try {
      const result = await authService.requestPasswordReset(data.email);
      if (result.success) {
        setHasSubmitted(true);
      } else {
        setServerError(GENERIC_ERROR_MESSAGE);
      }
    } catch {
      setServerError(GENERIC_ERROR_MESSAGE);
    }
  };

  return (
    <AuthPageLayout
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Lembrou sua senha?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Voltar para login
          </Link>
        </p>
      }
    >
      <h1 className="font-display font-bold text-2xl mb-1">Recuperar senha</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Informe seu e-mail para receber as instruções de redefinição.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            autoComplete="email"
            aria-invalid={errors.email ? 'true' : undefined}
            aria-describedby={errors.email ? 'forgot-password-email-error' : undefined}
            {...register('email')}
            className={errors.email ? 'border-destructive' : ''}
          />
          {errors.email && (
            <p id="forgot-password-email-error" className="text-xs text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        {serverError && (
          <div
            role="alert"
            className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive"
          >
            {serverError}
          </div>
        )}

        {hasSubmitted && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-muted-foreground"
          >
            {SAFE_CONFIRMATION_MESSAGE}
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full gradient-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all"
        >
          {isSubmitting ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</>
          ) : (
            'Enviar instruções'
          )}
        </Button>
      </form>
    </AuthPageLayout>
  );
}
