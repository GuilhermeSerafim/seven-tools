import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { PasswordField } from '@/components/auth/PasswordField';

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Informe a senha'),
});

type FormData = z.infer<typeof schema>;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    const result = await login(data.email, data.password);
    if (result.success) {
      const user = result.session?.user;
      let destination = '/hub';
      if (user?.mustChangePassword) {
        destination = '/alterar-senha';
      } else if (user?.validationStatus !== 'approved') {
        destination = '/aguardando-validacao';
      }
      navigate(destination, { replace: true });
    } else {
      setServerError(result.error ?? 'Erro ao entrar.');
    }
  };

  return (
    <AuthPageLayout
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Não tem conta?{' '}
          <Link to="/register" className="text-primary font-medium hover:underline">
            Cadastre-se
          </Link>
        </p>
      }
    >
      <h1 className="font-display font-bold text-2xl mb-1">Bem-vindo de volta</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Acesse sua conta para entrar no hub
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            autoComplete="email"
            {...register('email')}
            className={errors.email ? 'border-destructive' : ''}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <PasswordField
            id="password"
            label="Senha"
            autoComplete="current-password"
            error={errors.password?.message}
            registration={register('password')}
          />
          <div className="text-right">
            <Link to="/esqueci-senha" className="text-sm font-medium text-primary hover:underline">
              Esqueci minha senha
            </Link>
          </div>
        </div>

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
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Entrando...</>
          ) : (
            'Entrar'
          )}
        </Button>
      </form>
    </AuthPageLayout>
  );
}
