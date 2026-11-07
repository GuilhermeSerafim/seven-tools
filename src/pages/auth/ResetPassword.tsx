import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import authService from '@/auth/authService';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { PasswordField } from '@/components/auth/PasswordField';
import { Button } from '@/components/ui/button';

const SUCCESS_MESSAGE = 'Senha redefinida com sucesso.';
const INVALID_LINK_MESSAGE = 'Link inválido ou expirado.';
const GENERIC_ERROR_MESSAGE =
  'Não foi possível redefinir sua senha. Solicite um novo link.';

const schema = z.object({
  newPassword: z.string().min(6, 'A nova senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(1, 'Confirme a nova senha'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';
  const [showNew, setShowNew] = useState(false);
  const [serverError, setServerError] = useState('');
  const [hasSucceeded, setHasSucceeded] = useState(false);
  const passwordVisibility: [boolean, () => void] = [
    showNew,
    () => setShowNew((current) => !current),
  ];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    setHasSucceeded(false);

    try {
      const result = await authService.confirmPasswordReset(token, data.newPassword);
      if (result.success) {
        authService.clearLocalSession();
        setHasSucceeded(true);
      } else {
        setServerError(GENERIC_ERROR_MESSAGE);
      }
    } catch {
      setServerError(GENERIC_ERROR_MESSAGE);
    }
  };

  if (!token) {
    return (
      <AuthPageLayout
        footer={
          <p className="text-center text-sm text-muted-foreground">
            Lembrou sua senha?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Voltar para login
            </Link>
          </p>
        }
      >
        <h1 className="mb-1 font-display text-2xl font-bold">Redefinir senha</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Solicite um novo link para continuar com segurança.
        </p>

        <div
          role="alert"
          className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {INVALID_LINK_MESSAGE}
        </div>

        <Button
          asChild
          className="w-full gradient-primary font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all"
        >
          <Link to="/esqueci-senha">Solicitar novo link</Link>
        </Button>
      </AuthPageLayout>
    );
  }

  if (hasSucceeded) {
    return (
      <AuthPageLayout>
        <h1 className="mb-1 font-display text-2xl font-bold">Senha atualizada</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Você já pode entrar com sua nova senha.
        </p>

        <div
          role="status"
          aria-live="polite"
          className="mb-4 rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-muted-foreground"
        >
          {SUCCESS_MESSAGE}
        </div>

        <Button
          asChild
          className="w-full gradient-primary font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all"
        >
          <Link to="/login">Entrar</Link>
        </Button>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Lembrou sua senha?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Voltar para login
          </Link>
        </p>
      }
    >
      <h1 className="mb-1 font-display text-2xl font-bold">Criar nova senha</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Defina uma nova senha para acessar sua conta.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <PasswordField
          id="newPassword"
          label="Nova senha"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          registration={{
            ...register('newPassword'),
            'aria-invalid': errors.newPassword ? 'true' : undefined,
          }}
          visibilityState={passwordVisibility}
        />

        <PasswordField
          id="confirmPassword"
          label="Confirmar nova senha"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          registration={{
            ...register('confirmPassword'),
            'aria-invalid': errors.confirmPassword ? 'true' : undefined,
          }}
          showToggle={false}
        />

        {serverError && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {serverError}
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full gradient-primary font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redefinindo...
            </>
          ) : (
            'Redefinir senha'
          )}
        </Button>
      </form>
    </AuthPageLayout>
  );
}
