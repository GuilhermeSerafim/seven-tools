import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Loader2, Shield, Building2, User as UserIcon,
  AtSign, Link as LinkIcon, Globe, MapPin, Briefcase, Lock, ImageIcon,
} from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { UserAvatar, CompanyLogo } from '@/components/ui/UserAvatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';

const accountSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  jobTitle: z.string().optional(),
  avatarUrl: z.string().url('URL inválida').or(z.literal('')).optional(),
  instagram: z.string().optional(),
  linkedin: z.string().optional(),
});

const companySchema = z.object({
  name: z.string().min(2, 'Nome da empresa deve ter ao menos 2 caracteres'),
  logoUrl: z.string().url('URL inválida').or(z.literal('')).optional(),
  website: z.string().optional(),
  instagram: z.string().optional(),
  segment: z.string().optional(),
  shortDescription: z.string().max(160, 'Máximo de 160 caracteres').optional(),
  city: z.string().optional(),
});

type AccountData = z.infer<typeof accountSchema>;
type CompanyData = z.infer<typeof companySchema>;

function AccountTab() {
  const { user, updateUser } = useAuth();
  const [saved, setSaved] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl ?? '');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AccountData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: user?.name ?? '',
      jobTitle: user?.jobTitle ?? '',
      avatarUrl: user?.avatarUrl ?? '',
      instagram: user?.instagram ?? '',
      linkedin: user?.linkedin ?? '',
    },
  });

  const watchedAvatarUrl = watch('avatarUrl');

  const onSubmit = async (data: AccountData) => {
    const result = await updateUser({ ...data, avatarUrl: data.avatarUrl || undefined });
    if (result) {
      setAvatarPreview(data.avatarUrl || '');
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  if (!user) return null;

  const previewUrl = watchedAvatarUrl || avatarPreview;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center gap-4">
        <UserAvatar name={user.name} avatarUrl={previewUrl || undefined} size="lg" />
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold truncate">{user.name}</p>
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          <Badge
            variant="outline"
            className={`mt-1.5 ${user.role === 'admin' ? 'border-primary/40 text-primary bg-primary/10' : 'border-border text-muted-foreground'}`}
          >
            {user.role === 'admin' ? (
              <><Shield className="h-3 w-3 mr-1" /> Administrador</>
            ) : 'Membro'}
          </Badge>
        </div>
      </div>

      <Separator />

      <div className="space-y-1.5">
        <Label className="text-muted-foreground text-xs flex items-center gap-1">
          <Lock className="h-3 w-3" /> E-mail (não editável)
        </Label>
        <Input value={user.email} disabled className="bg-surface cursor-not-allowed" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="acc-name" className="flex items-center gap-1.5">
            <UserIcon className="h-3.5 w-3.5" /> Nome
          </Label>
          <Input id="acc-name" {...register('name')} className={errors.name ? 'border-destructive' : ''} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="acc-job" className="flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5" /> Cargo
          </Label>
          <Input id="acc-job" placeholder="Ex: CEO, Diretor Comercial..." {...register('jobTitle')} />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="acc-avatar" className="flex items-center gap-1.5">
            <ImageIcon className="h-3.5 w-3.5" /> Foto do perfil (URL)
          </Label>
          <Input
            id="acc-avatar"
            placeholder="https://exemplo.com/minha-foto.jpg"
            {...register('avatarUrl')}
            className={errors.avatarUrl ? 'border-destructive' : ''}
          />
          {errors.avatarUrl && <p className="text-xs text-destructive">{errors.avatarUrl.message}</p>}
          <p className="text-xs text-muted-foreground">Cole a URL de uma imagem. Upload direto será disponibilizado em breve.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="acc-ig" className="flex items-center gap-1.5">
            <AtSign className="h-3.5 w-3.5" /> Instagram
          </Label>
          <Input id="acc-ig" placeholder="@usuario" {...register('instagram')} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="acc-li" className="flex items-center gap-1.5">
            <LinkIcon className="h-3.5 w-3.5" /> LinkedIn
          </Label>
          <Input id="acc-li" placeholder="linkedin.com/in/..." {...register('linkedin')} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting} className="gradient-primary text-primary-foreground font-semibold shadow-md shadow-primary/20 hover:-translate-y-0.5 transition-all">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Salvar alterações
        </Button>
        {saved && <p className="text-sm text-success font-medium">Salvo com sucesso!</p>}
      </div>
    </form>
  );
}

function CompanyTab() {
  const { company, updateCompany } = useAuth();
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CompanyData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: company?.name ?? '',
      logoUrl: company?.logoUrl ?? '',
      website: company?.website ?? '',
      instagram: company?.instagram ?? '',
      segment: company?.segment ?? '',
      shortDescription: company?.shortDescription ?? '',
      city: company?.city ?? '',
    },
  });

  const watchedLogoUrl = watch('logoUrl');

  const onSubmit = async (data: CompanyData) => {
    const result = await updateCompany({ ...data, logoUrl: data.logoUrl || undefined });
    if (result) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  if (!company) return null;

  const previewLogoUrl = watchedLogoUrl || company.logoUrl;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center gap-4">
        <CompanyLogo name={company.name} logoUrl={previewLogoUrl || undefined} size="lg" />
        <div>
          <p className="font-display font-semibold">{company.name}</p>
          {company.city && <p className="text-sm text-muted-foreground">{company.city}</p>}
          {company.segment && <p className="text-xs text-muted-foreground mt-0.5">{company.segment}</p>}
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="cmp-name" className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" /> Nome da empresa
          </Label>
          <Input id="cmp-name" {...register('name')} className={errors.name ? 'border-destructive' : ''} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="cmp-logo" className="flex items-center gap-1.5">
            <ImageIcon className="h-3.5 w-3.5" /> Logo da empresa (URL)
          </Label>
          <Input
            id="cmp-logo"
            placeholder="https://exemplo.com/logo.png"
            {...register('logoUrl')}
            className={errors.logoUrl ? 'border-destructive' : ''}
          />
          {errors.logoUrl && <p className="text-xs text-destructive">{errors.logoUrl.message}</p>}
          <p className="text-xs text-muted-foreground">Cole a URL do logo. Upload direto será disponibilizado em breve.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cmp-segment" className="flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5" /> Segmento
          </Label>
          <Input id="cmp-segment" placeholder="Ex: Marketing, Saúde, Varejo..." {...register('segment')} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cmp-city" className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" /> Cidade
          </Label>
          <Input id="cmp-city" placeholder="Cidade / Estado" {...register('city')} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cmp-web" className="flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5" /> Site
          </Label>
          <Input id="cmp-web" placeholder="https://..." {...register('website')} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cmp-ig" className="flex items-center gap-1.5">
            <AtSign className="h-3.5 w-3.5" /> Instagram
          </Label>
          <Input id="cmp-ig" placeholder="@empresa" {...register('instagram')} />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="cmp-desc">Descrição curta</Label>
          <Textarea
            id="cmp-desc"
            placeholder="Uma frase sobre a empresa (máx. 160 caracteres)"
            rows={3}
            {...register('shortDescription')}
            className={errors.shortDescription ? 'border-destructive' : ''}
          />
          {errors.shortDescription && <p className="text-xs text-destructive">{errors.shortDescription.message}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting} className="gradient-primary text-primary-foreground font-semibold shadow-md shadow-primary/20 hover:-translate-y-0.5 transition-all">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Salvar alterações
        </Button>
        {saved && <p className="text-sm text-success font-medium">Salvo com sucesso!</p>}
      </div>
    </form>
  );
}

export default function Profile() {
  const { user, company, isAdmin } = useAuth();
  const hasCompany = Boolean(company);

  if (!user) return null;

  return (
    <div className="container py-8 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="font-display font-bold text-2xl md:text-3xl mb-1">Meu Perfil</h1>
        <p className="text-muted-foreground mb-8">Gerencie sua conta e as informações da sua empresa</p>

        <Tabs defaultValue="account">
          <TabsList className="mb-6">
            <TabsTrigger value="account" className="flex items-center gap-1.5">
              <UserIcon className="h-4 w-4" /> Minha Conta
            </TabsTrigger>
            {hasCompany && (
              <TabsTrigger value="company" className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4" /> Minha Empresa
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="account">
            <div className="rounded-xl border border-border/30 bg-card shadow-depth p-6">
              <AccountTab />
            </div>
          </TabsContent>

          {hasCompany && (
            <TabsContent value="company">
              <div className="rounded-xl border border-border/30 bg-card shadow-depth p-6">
                <CompanyTab />
              </div>
            </TabsContent>
          )}
        </Tabs>

        {isAdmin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="font-display font-semibold text-base text-primary">Administração</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Você tem acesso de administrador ao ecossistema SEVEN. A fila de membros pendentes já está disponível para revisão.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                to="/admin/membros-pendentes"
                className="group rounded-lg border border-primary/20 bg-card shadow-depth p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="h-4 w-4 text-primary" />
                      <p className="font-display font-semibold text-sm">Revisar membros pendentes</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Abrir a fila de validação e aprovar ou bloquear cadastros.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs border-primary/20 text-primary bg-primary/5">
                    Abrir
                  </Badge>
                </div>
              </Link>
              <div className="rounded-lg border border-border/30 bg-card shadow-depth p-4 opacity-60">
                <p className="font-display font-semibold text-sm mb-1">Gestão de Empresas</p>
                <p className="text-xs text-muted-foreground">Visualizar e gerenciar empresas cadastradas</p>
                <Badge variant="outline" className="mt-2 text-xs">Em breve</Badge>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
