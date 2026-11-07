import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  ScanSearch,
  ListTodo,
  Megaphone,
  Handshake,
  Settings,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContainerScroll } from '@/components/ui/container-scroll-animation';
import RadialOrbitalTimeline from '@/components/ui/radial-orbital-timeline';

const ROTATING_WORDS = ['inteligentes', 'estratégicas', 'decisivas', 'poderosas', 'práticas'];

const TOOLS = [
  {
    icon: FileText,
    name: 'Caloni Propostas',
    description: 'Crie, edite e revise propostas comerciais dentro da plataforma SEVEN.',
  },
  {
    icon: ScanSearch,
    name: 'Raio-X Comercial',
    description: 'Diagnóstico comercial focado em causa raiz, funil e decisão executiva.',
  },
  {
    icon: ListTodo,
    name: 'Radar de Leads',
    description: 'Priorize oportunidades com score, faixa e ação recomendada.',
  },
];

const MODULES = [
  { icon: Megaphone, name: 'Marketing', description: 'Tráfego, conteúdo e conversão' },
  { icon: Handshake, name: 'Comercial', description: 'Vendas, CRM e propostas' },
  { icon: Settings, name: 'Operação', description: 'Processos, equipe e eficiência' },
  { icon: DollarSign, name: 'Financeiro', description: 'Indicadores, custos e margem' },
];

const TIMELINE_DATA = [
  {
    id: 1,
    title: 'Marketing',
    date: '',
    content: 'Tráfego, conteúdo e conversão',
    category: 'módulo',
    icon: Megaphone,
    relatedIds: [2],
    status: 'completed' as const,
    energy: 85,
  },
  {
    id: 2,
    title: 'Comercial',
    date: '',
    content: 'Vendas, CRM e propostas',
    category: 'módulo',
    icon: Handshake,
    relatedIds: [1, 3],
    status: 'completed' as const,
    energy: 90,
  },
  {
    id: 3,
    title: 'Operação',
    date: '',
    content: 'Processos, equipe e eficiência',
    category: 'módulo',
    icon: Settings,
    relatedIds: [2, 4],
    status: 'in-progress' as const,
    energy: 70,
  },
  {
    id: 4,
    title: 'Financeiro',
    date: '',
    content: 'Indicadores, custos e margem',
    category: 'módulo',
    icon: DollarSign,
    relatedIds: [3],
    status: 'pending' as const,
    energy: 60,
  },
];

function HeroSection() {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setWordIndex((prev) => (prev === ROTATING_WORDS.length - 1 ? 0 : prev + 1));
    }, 2000);

    return () => clearTimeout(timeout);
  }, [wordIndex]);

  return (
    <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-background">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(ellipse at center, rgba(255,140,26,0.06), transparent 70%)',
        }}
      />

      <div className="relative z-10 container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="max-w-4xl mx-auto flex flex-col items-center gap-8"
        >
          <div className="flex flex-col items-center gap-3">
            <img
              src="/seven-logo.png"
              alt="SEVEN"
              className="h-36 w-auto object-contain drop-shadow-[0_0_12px_rgba(255,140,26,0.25)]"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className="font-display font-bold text-xl tracking-tight">
              SEVEN <span className="text-primary">Tools</span>
            </span>
          </div>

          <h1 className="font-display font-extrabold text-5xl md:text-7xl tracking-tighter leading-tight">
            <span>Ferramentas empresariais</span>
            <br />
            <span>que são </span>
            <span className="relative inline-flex w-[280px] md:w-[400px] justify-center overflow-hidden text-primary">
              &nbsp;
              {ROTATING_WORDS.map((word, index) => (
                <motion.span
                  key={index}
                  className="absolute font-extrabold"
                  initial={{ opacity: 0, y: -100 }}
                  transition={{ type: 'spring', stiffness: 50, damping: 25 }}
                  animate={
                    wordIndex === index
                      ? { y: 0, opacity: 1 }
                      : { y: wordIndex > index ? -150 : 150, opacity: 0 }
                  }
                >
                  {word}
                </motion.span>
              ))}
            </span>
          </h1>

          <p className="text-lg md:text-xl leading-relaxed tracking-tight text-muted-foreground max-w-2xl">
            Hub exclusivo do ecossistema SEVEN. IAs, ferramentas e recursos organizados por área do negócio.
          </p>

          <Link to="/hub">
            <Button
              size="lg"
              className="gradient-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all gap-2"
            >
              Acessar o Hub <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function ProductSection() {
  return (
    <section className="bg-background">
      <ContainerScroll
        titleComponent={
          <div className="mb-4">
            <h2 className="font-display font-bold text-4xl md:text-5xl">
              SEVEN na <span className="text-primary">mídia</span>
            </h2>
          </div>
        }
      >
        <a
          href="https://valor.globo.com/patrocinado/pressworks/noticia/2025/10/07/seven-o-clube-de-r-100-mil-onde-carater-vale-mais-que-faturamento.ghtml"
          target="_blank"
          rel="noopener noreferrer"
          className="relative w-full h-full block group"
        >
          <img
            src="https://s2-valor.glbimg.com/NoB6GwywIn7yWmWLNTMB69qIuFM=/1000x0/smart/filters:strip_icc()/i.s3.glbimg.com/v1/AUTH_267e64fb6a7344809237b1389815054d/producao/pressworks/valor/sevenclubevalor.jpeg"
            alt="SEVEN no Valor Econômico"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-1 text-[10px] font-bold text-white/90 uppercase tracking-wider mb-3">
              Valor Econômico
            </span>
            <h3 className="font-display font-bold text-xl md:text-2xl text-white leading-tight mb-2">
              SEVEN: o clube de R$ 100 mil onde caráter vale mais que faturamento
            </h3>
            <span className="inline-flex items-center gap-1.5 text-sm text-white/70 group-hover:text-primary transition-colors">
              Ler matéria <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </a>
      </ContainerScroll>
    </section>
  );
}

function ToolsSection() {
  return (
    <section className="bg-background border-t border-border/10">
      <div className="container py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="font-display font-bold text-3xl md:text-4xl mb-3">
            Ferramentas Inteligentes
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            IAs e recursos exclusivos para cada área do negócio
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {TOOLS.map((tool, i) => (
            <motion.div
              key={tool.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="rounded-2xl border border-border/30 bg-card shadow-depth p-6 hover:-translate-y-1 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <tool.icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display font-bold text-lg">{tool.name}</h3>
                    <span className="rounded-full bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 uppercase">
                      Novo
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{tool.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MethodSection() {
  return (
    <section className="bg-background border-t border-border/10">
      <div className="container py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h2 className="font-display font-bold text-3xl md:text-4xl mb-3">
            Método <span className="text-primary">SEVEN</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Cada área do negócio conectada em um ecossistema inteligente
          </p>
        </motion.div>

        <RadialOrbitalTimeline timelineData={TIMELINE_DATA} />
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="bg-background border-t border-border/10">
      <div
        className="container py-20 md:py-28"
        style={{
          backgroundImage: 'radial-gradient(ellipse at center, rgba(255,140,26,0.08), transparent 60%)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto"
        >
          <h2 className="font-display font-bold text-3xl md:text-4xl mb-4">
            Pronto para transformar sua operação comercial?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Acesse o hub exclusivo do ecossistema SEVEN
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/hub">
              <Button
                size="lg"
                className="gradient-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all gap-2"
              >
                Acessar o Hub <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="outline" className="font-semibold gap-2">
                Criar conta
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="bg-background text-foreground">
      <HeroSection />
      <ToolsSection />
      <MethodSection />
      <ProductSection />
      <CtaSection />
    </div>
  );
}
