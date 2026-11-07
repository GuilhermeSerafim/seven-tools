# Auth Hero Split-Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign Login and Register pages with a split-screen layout — animated hero on the left, clean form on the right.

**Architecture:** Create a shared `AuthLayout.tsx` component that renders the split-screen grid with the animated hero (CSS grid background + Framer Motion radial glow + staggered content). Login.tsx and Register.tsx are refactored to use this layout, removing their own wrappers/logos and passing only the form content as children.

**Tech Stack:** React, Tailwind CSS, Framer Motion v12, Lucide icons, shadcn/ui (Button, Input, Label).

---

### Task 1: Create AuthLayout.tsx

**Files:**
- Create: `src/components/auth/AuthLayout.tsx`

- [ ] **Step 1: Create the AuthLayout component**

Create `src/components/auth/AuthLayout.tsx` with the following content:

```tsx
import { FileCheck, ScanSearch, Zap, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const FEATURES = [
  { icon: FileCheck, text: 'Propostas comerciais profissionais em minutos' },
  { icon: ScanSearch, text: 'Diagnóstico comercial com IA integrada' },
  { icon: Zap, text: 'Ferramentas inteligentes para fechar negócios' },
  { icon: Shield, text: 'Seus dados seguros e organizados' },
];

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* ── Hero (left side, hidden on mobile) ──────────────────── */}
      <div
        className="relative hidden md:flex flex-col items-center justify-center overflow-hidden bg-background"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,140,26,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,140,26,0.06) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      >
        {/* Animated radial glow */}
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255,140,26,0.15), transparent 70%)',
          }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-center gap-8 px-12 max-w-md">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-3"
          >
            <img
              src="/seven-logo.png"
              alt="SEVEN"
              className="h-20 w-auto object-contain drop-shadow-[0_0_12px_rgba(255,140,26,0.25)]"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <span className="font-display font-bold text-xl tracking-tight">
              SEVEN <span className="text-primary">Tools</span>
            </span>
          </motion.div>

          {/* Tagline */}
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display font-bold text-3xl leading-tight text-center"
          >
            Hub de Ferramentas Comerciais Inteligentes
          </motion.h2>

          {/* Features */}
          <div className="flex flex-col gap-3 w-full">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.text}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="h-4 w-4" />
                </div>
                <span className="text-sm text-muted-foreground">{feature.text}</span>
              </motion.div>
            ))}
          </div>

          {/* Badge */}
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold text-primary uppercase tracking-wider"
          >
            Método SEVEN
          </motion.span>
        </div>
      </div>

      {/* ── Form (right side) ───────────────────────────────────── */}
      <div
        className="flex flex-col items-center justify-center bg-background px-6 py-12"
        style={{
          backgroundImage: 'radial-gradient(ellipse at top, rgba(255,140,26,0.04), transparent 60%)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify file exists**

Run: `ls src/components/auth/AuthLayout.tsx`
Expected: file listed.

---

### Task 2: Refactor Login.tsx to use AuthLayout

**Files:**
- Modify: `src/pages/auth/Login.tsx`

- [ ] **Step 1: Rewrite Login.tsx**

Replace the entire content of `src/pages/auth/Login.tsx` with:

```tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/components/auth/AuthLayout';

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Informe a senha'),
});

type FormData = z.infer<typeof schema>;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
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
      navigate('/', { replace: true });
    } else {
      setServerError(result.error ?? 'Erro ao entrar.');
    }
  };

  return (
    <AuthLayout>
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

        <div className="space-y-1.5">
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              {...register('password')}
              className={`pr-10 ${errors.password ? 'border-destructive' : ''}`}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
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

      <p className="text-center text-sm text-muted-foreground mt-6">
        Não tem conta?{' '}
        <Link to="/register" className="text-primary font-medium hover:underline">
          Cadastre-se
        </Link>
      </p>
    </AuthLayout>
  );
}
```

---

### Task 3: Refactor Register.tsx to use AuthLayout

**Files:**
- Modify: `src/pages/auth/Register.tsx`

- [ ] **Step 1: Rewrite Register.tsx**

Replace the entire content of `src/pages/auth/Register.tsx` with:

```tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/components/auth/AuthLayout';

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  companyName: z.string().min(2, 'Nome da empresa deve ter ao menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'As senhas não conferem',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export default function Register() {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    const result = await authRegister({
      name: data.name,
      email: data.email,
      password: data.password,
      companyName: data.companyName,
    });
    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setServerError(result.error ?? 'Erro ao criar conta.');
    }
  };

  return (
    <AuthLayout>
      <h1 className="font-display font-bold text-2xl mb-1">Criar sua conta</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Junte-se ao ecossistema SEVEN
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Seu nome</Label>
          <Input
            id="name"
            placeholder="Nome completo"
            autoComplete="name"
            {...register('name')}
            className={errors.name ? 'border-destructive' : ''}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="companyName">Nome da empresa</Label>
          <Input
            id="companyName"
            placeholder="Sua empresa"
            {...register('companyName')}
            className={errors.companyName ? 'border-destructive' : ''}
          />
          {errors.companyName && (
            <p className="text-xs text-destructive">{errors.companyName.message}</p>
          )}
        </div>

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
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              {...register('password')}
              className={`pr-10 ${errors.password ? 'border-destructive' : ''}`}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirmar senha</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Repita a senha"
            autoComplete="new-password"
            {...register('confirmPassword')}
            className={errors.confirmPassword ? 'border-destructive' : ''}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
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
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Criando conta...</>
          ) : (
            'Criar conta'
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Já tem conta?{' '}
        <Link to="/login" className="text-primary font-medium hover:underline">
          Entrar
        </Link>
      </p>
    </AuthLayout>
  );
}
```

---

### Task 4: Build verification

- [ ] **Step 1: Run build**

Run: `cd seven_tools_front && npx vite build 2>&1 | tail -10`
Expected: Build completes with no errors.

- [ ] **Step 2: Commit**

```bash
git add src/components/auth/AuthLayout.tsx src/pages/auth/Login.tsx src/pages/auth/Register.tsx
git commit -m "feat: auth split-screen with animated hero layout"
```
