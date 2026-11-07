import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import authService from '@/auth/authService';
import { Button } from '@/components/ui/button';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { PasswordField } from '@/components/auth/PasswordField';

const schema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual'),
  newPassword: z.string().min(6, 'A nova senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(1, 'Confirme a nova senha'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'A nova senha deve ser diferente da atual',
  path: ['newPassword'],
});

type FormData = z.infer<typeof schema>;

export default function ChangePassword() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [showNew, setShowNew] = useState(false);
  const newVisibility: [boolean, () => void] = [showNew, () => setShowNew(v => !v)];
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    const result = await authService.changePassword(data.currentPassword, data.newPassword);
    if (result.success) {
      await refreshUser();
      navigate('/hub', { replace: true });
    } else {
      setServerError(result.error ?? 'Erro ao trocar senha.');
    }
  };

  return (
    <AuthPageLayout>
      <h1 className="font-display font-bold text-2xl mb-1">Atualize sua senha</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Por segurança, defina uma nova senha antes de continuar.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <PasswordField
          id="currentPassword"
          label="Senha atual"
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          registration={register('currentPassword')}
        />

        <PasswordField
          id="newPassword"
          label="Nova senha"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          registration={register('newPassword')}
          visibilityState={newVisibility}
        />

        <PasswordField
          id="confirmPassword"
          label="Confirmar nova senha"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          registration={register('confirmPassword')}
          showToggle={false}
          visibilityState={newVisibility}
        />

        {serverError && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {serverError}
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full gradient-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all"
        >
          {isSubmitting ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Atualizando...</>
          ) : (
            'Atualizar senha'
          )}
        </Button>
      </form>
    </AuthPageLayout>
  );
}
