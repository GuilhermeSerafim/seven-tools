# Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a public landing page for SEVEN Tools using 3 adapted 21st.dev components (animated hero, container-scroll, radial-orbital-timeline) with the app's orange/dark palette.

**Architecture:** Single `LandingPage.tsx` file with 5 inline sections. Existing 21st.dev components are adapted in-place (color changes). New public route `/landing` added to `App.tsx` outside the `ProtectedRoute` wrapper.

**Tech Stack:** React, Tailwind CSS, Framer Motion v12, Lucide icons, shadcn/ui (Button), existing 21st.dev components.

---

### Task 1: Adapt radial-orbital-timeline colors to SEVEN palette

**Files:**
- Modify: `src/components/ui/radial-orbital-timeline.tsx`

- [ ] **Step 1: Update the component colors**

In `src/components/ui/radial-orbital-timeline.tsx`, replace the entire file content with:

```tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { ArrowRight, Link, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TimelineItem {
  id: number;
  title: string;
  date: string;
  content: string;
  category: string;
  icon: React.ElementType;
  relatedIds: number[];
  status: "completed" | "in-progress" | "pending";
  energy: number;
}

interface RadialOrbitalTimelineProps {
  timelineData: TimelineItem[];
}

export default function RadialOrbitalTimeline({
  timelineData,
}: RadialOrbitalTimelineProps) {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>(
    {}
  );
  const [viewMode, setViewMode] = useState<"orbital">("orbital");
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
  const [centerOffset, setCenterOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      setExpandedItems({});
      setActiveNodeId(null);
      setPulseEffect({});
      setAutoRotate(true);
    }
  };

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        if (parseInt(key) !== id) {
          newState[parseInt(key)] = false;
        }
      });

      newState[id] = !prev[id];

      if (!prev[id]) {
        setActiveNodeId(id);
        setAutoRotate(false);

        const relatedItems = getRelatedItems(id);
        const newPulseEffect: Record<number, boolean> = {};
        relatedItems.forEach((relId) => {
          newPulseEffect[relId] = true;
        });
        setPulseEffect(newPulseEffect);

        centerViewOnNode(id);
      } else {
        setActiveNodeId(null);
        setAutoRotate(true);
        setPulseEffect({});
      }

      return newState;
    });
  };

  useEffect(() => {
    let rotationTimer: NodeJS.Timeout;

    if (autoRotate && viewMode === "orbital") {
      rotationTimer = setInterval(() => {
        setRotationAngle((prev) => {
          const newAngle = (prev + 0.3) % 360;
          return Number(newAngle.toFixed(3));
        });
      }, 50);
    }

    return () => {
      if (rotationTimer) {
        clearInterval(rotationTimer);
      }
    };
  }, [autoRotate, viewMode]);

  const centerViewOnNode = (nodeId: number) => {
    if (viewMode !== "orbital" || !nodeRefs.current[nodeId]) return;

    const nodeIndex = timelineData.findIndex((item) => item.id === nodeId);
    const totalNodes = timelineData.length;
    const targetAngle = (nodeIndex / totalNodes) * 360;

    setRotationAngle(270 - targetAngle);
  };

  const calculateNodePosition = (index: number, total: number) => {
    const angle = ((index / total) * 360 + rotationAngle) % 360;
    const radius = 200;
    const radian = (angle * Math.PI) / 180;

    const x = radius * Math.cos(radian) + centerOffset.x;
    const y = radius * Math.sin(radian) + centerOffset.y;

    const zIndex = Math.round(100 + 50 * Math.cos(radian));
    const opacity = Math.max(
      0.4,
      Math.min(1, 0.4 + 0.6 * ((1 + Math.sin(radian)) / 2))
    );

    return { x, y, angle, zIndex, opacity };
  };

  const getRelatedItems = (itemId: number): number[] => {
    const currentItem = timelineData.find((item) => item.id === itemId);
    return currentItem ? currentItem.relatedIds : [];
  };

  const isRelatedToActive = (itemId: number): boolean => {
    if (!activeNodeId) return false;
    const relatedItems = getRelatedItems(activeNodeId);
    return relatedItems.includes(itemId);
  };

  const getStatusStyles = (status: TimelineItem["status"]): string => {
    switch (status) {
      case "completed":
        return "text-primary-foreground bg-primary border-primary";
      case "in-progress":
        return "text-primary bg-primary/20 border-primary/50";
      case "pending":
        return "text-muted-foreground bg-muted border-border";
      default:
        return "text-muted-foreground bg-muted border-border";
    }
  };

  return (
    <div
      className="w-full h-[600px] flex flex-col items-center justify-center bg-background overflow-hidden"
      ref={containerRef}
      onClick={handleContainerClick}
    >
      <div className="relative w-full max-w-4xl h-full flex items-center justify-center">
        <div
          className="absolute w-full h-full flex items-center justify-center"
          ref={orbitRef}
          style={{
            perspective: "1000px",
            transform: `translate(${centerOffset.x}px, ${centerOffset.y}px)`,
          }}
        >
          <div className="absolute w-16 h-16 rounded-full bg-gradient-to-br from-primary via-orange-400 to-amber-500 animate-pulse flex items-center justify-center z-10">
            <div className="absolute w-20 h-20 rounded-full border border-primary/20 animate-ping opacity-70"></div>
            <div
              className="absolute w-24 h-24 rounded-full border border-primary/10 animate-ping opacity-50"
              style={{ animationDelay: "0.5s" }}
            ></div>
            <div className="w-8 h-8 rounded-full bg-primary-foreground/80 backdrop-blur-md"></div>
          </div>

          <div className="absolute w-96 h-96 rounded-full border border-primary/10"></div>

          {timelineData.map((item, index) => {
            const position = calculateNodePosition(index, timelineData.length);
            const isExpanded = expandedItems[item.id];
            const isRelated = isRelatedToActive(item.id);
            const isPulsing = pulseEffect[item.id];
            const Icon = item.icon;

            const nodeStyle = {
              transform: `translate(${position.x}px, ${position.y}px)`,
              zIndex: isExpanded ? 200 : position.zIndex,
              opacity: isExpanded ? 1 : position.opacity,
            };

            return (
              <div
                key={item.id}
                ref={(el) => (nodeRefs.current[item.id] = el)}
                className="absolute transition-all duration-700 cursor-pointer"
                style={nodeStyle}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItem(item.id);
                }}
              >
                <div
                  className={`absolute rounded-full -inset-1 ${
                    isPulsing ? "animate-pulse duration-1000" : ""
                  }`}
                  style={{
                    background: `radial-gradient(circle, rgba(255,140,26,0.2) 0%, rgba(255,140,26,0) 70%)`,
                    width: `${item.energy * 0.5 + 40}px`,
                    height: `${item.energy * 0.5 + 40}px`,
                    left: `-${(item.energy * 0.5 + 40 - 40) / 2}px`,
                    top: `-${(item.energy * 0.5 + 40 - 40) / 2}px`,
                  }}
                ></div>

                <div
                  className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${
                    isExpanded
                      ? "bg-primary text-primary-foreground"
                      : isRelated
                      ? "bg-primary/30 text-primary"
                      : "bg-card text-foreground"
                  }
                  border-2 
                  ${
                    isExpanded
                      ? "border-primary shadow-lg shadow-primary/30"
                      : isRelated
                      ? "border-primary animate-pulse"
                      : "border-primary/40"
                  }
                  transition-all duration-300 transform
                  ${isExpanded ? "scale-150" : ""}
                `}
                >
                  <Icon size={16} />
                </div>

                <div
                  className={`
                  absolute top-12  whitespace-nowrap
                  text-xs font-semibold tracking-wider
                  transition-all duration-300
                  ${isExpanded ? "text-foreground scale-125" : "text-muted-foreground"}
                `}
                >
                  {item.title}
                </div>

                {isExpanded && (
                  <Card className="absolute top-20 left-1/2 -translate-x-1/2 w-64 bg-card/90 backdrop-blur-lg border-primary/30 shadow-xl shadow-primary/10 overflow-visible">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-px h-3 bg-primary/50"></div>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <Badge
                          className={`px-2 text-xs ${getStatusStyles(
                            item.status
                          )}`}
                        >
                          {item.status === "completed"
                            ? "ATIVO"
                            : item.status === "in-progress"
                            ? "EM BREVE"
                            : "PLANEJADO"}
                        </Badge>
                        {item.date && (
                          <span className="text-xs font-mono text-muted-foreground">
                            {item.date}
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-sm mt-2">
                        {item.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">
                      <p>{item.content}</p>

                      <div className="mt-4 pt-3 border-t border-border/30">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="flex items-center">
                            <Zap size={10} className="mr-1 text-primary" />
                            Maturidade
                          </span>
                          <span className="font-mono">{item.energy}%</span>
                        </div>
                        <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-amber-500"
                            style={{ width: `${item.energy}%` }}
                          ></div>
                        </div>
                      </div>

                      {item.relatedIds.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-border/30">
                          <div className="flex items-center mb-2">
                            <Link size={10} className="text-muted-foreground mr-1" />
                            <h4 className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
                              Módulos Conectados
                            </h4>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {item.relatedIds.map((relatedId) => {
                              const relatedItem = timelineData.find(
                                (i) => i.id === relatedId
                              );
                              return (
                                <Button
                                  key={relatedId}
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center h-6 px-2 py-0 text-xs rounded-none border-primary/20 bg-transparent hover:bg-primary/10 text-muted-foreground hover:text-foreground transition-all"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleItem(relatedId);
                                  }}
                                >
                                  {relatedItem?.title}
                                  <ArrowRight
                                    size={8}
                                    className="ml-1 text-primary/60"
                                  />
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify file saved**

Run: `ls src/components/ui/radial-orbital-timeline.tsx`
Expected: file listed.

---

### Task 2: Adapt container-scroll-animation colors

**Files:**
- Modify: `src/components/ui/container-scroll-animation.tsx`

- [ ] **Step 1: Update dark theme colors**

In `src/components/ui/container-scroll-animation.tsx`, replace the entire file content with:

```tsx
"use client";
import React, { useRef } from "react";
import { useScroll, useTransform, motion, MotionValue } from "framer-motion";

export const ContainerScroll = ({
  titleComponent,
  children,
}: {
  titleComponent: string | React.ReactNode;
  children: React.ReactNode;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
  });
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const scaleDimensions = () => {
    return isMobile ? [0.7, 0.9] : [1.05, 1];
  };

  const rotate = useTransform(scrollYProgress, [0, 1], [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div
      className="h-[60rem] md:h-[80rem] flex items-center justify-center relative p-2 md:p-20"
      ref={containerRef}
    >
      <div
        className="py-10 md:py-40 w-full relative"
        style={{
          perspective: "1000px",
        }}
      >
        <Header translate={translate} titleComponent={titleComponent} />
        <Card rotate={rotate} translate={translate} scale={scale}>
          {children}
        </Card>
      </div>
    </div>
  );
};

export const Header = ({ translate, titleComponent }: any) => {
  return (
    <motion.div
      style={{
        translateY: translate,
      }}
      className="div max-w-5xl mx-auto text-center"
    >
      {titleComponent}
    </motion.div>
  );
};

export const Card = ({
  rotate,
  scale,
  children,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  translate: MotionValue<number>;
  children: React.ReactNode;
}) => {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        boxShadow:
          "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
      }}
      className="max-w-5xl -mt-12 mx-auto h-[30rem] md:h-[40rem] w-full border-2 border-primary/20 p-2 md:p-6 bg-card rounded-[30px] shadow-2xl"
    >
      <div className="h-full w-full overflow-hidden rounded-2xl bg-background md:rounded-2xl md:p-4">
        {children}
      </div>
    </motion.div>
  );
};
```

- [ ] **Step 2: Verify file saved**

Run: `ls src/components/ui/container-scroll-animation.tsx`
Expected: file listed.

---

### Task 3: Create LandingPage.tsx

**Files:**
- Create: `src/pages/LandingPage.tsx`

- [ ] **Step 1: Create the landing page component**

Create `src/pages/LandingPage.tsx` with:

```tsx
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileCheck, ScanSearch, Megaphone, Handshake,
  Settings, DollarSign, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FloatingPaths } from '@/components/ui/background-paths';
import { ContainerScroll } from '@/components/ui/container-scroll-animation';
import RadialOrbitalTimeline from '@/components/ui/radial-orbital-timeline';

// ─── Data ────────────────────────────────────────────────────────────────────

const ROTATING_WORDS = ['inteligentes', 'estratégicas', 'decisivas', 'poderosas', 'práticas'];

const TOOLS = [
  {
    icon: FileCheck,
    name: 'Proposta Comercial Smart',
    description: 'Monte ou valide sua proposta pelo Método Caloni. Análise estruturada com pontuação e sugestões.',
  },
  {
    icon: ScanSearch,
    name: 'Diagnóstico Comercial Caloni',
    description: 'Diagnóstico profundo do seu negócio em 7 blocos executivos de decisão.',
  },
];

const MODULES = [
  { icon: Megaphone, name: 'Marketing', description: 'Tráfego, conteúdo e conversão' },
  { icon: Handshake, name: 'Comercial', description: 'Vendas, CRM e propostas' },
  { icon: Settings, name: 'Operação', description: 'Processos, equipe e eficiência' },
  { icon: DollarSign, name: 'Financeiro', description: 'Indicadores, custos e margem' },
];

const TIMELINE_DATA = [
  { id: 1, title: 'Marketing', date: '', content: 'Tráfego, conteúdo e conversão', category: 'modulo', icon: Megaphone, relatedIds: [2], status: 'completed' as const, energy: 85 },
  { id: 2, title: 'Comercial', date: '', content: 'Vendas, CRM e propostas', category: 'modulo', icon: Handshake, relatedIds: [1, 3], status: 'completed' as const, energy: 90 },
  { id: 3, title: 'Operação', date: '', content: 'Processos, equipe e eficiência', category: 'modulo', icon: Settings, relatedIds: [2, 4], status: 'in-progress' as const, energy: 70 },
  { id: 4, title: 'Financeiro', date: '', content: 'Indicadores, custos e margem', category: 'modulo', icon: DollarSign, relatedIds: [3], status: 'pending' as const, energy: 60 },
];

// ─── Hero Section ────────────────────────────────────────────────────────────

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
      <div className="absolute inset-0 text-primary/20">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>
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
          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <img
              src="/seven-logo.png"
              alt="SEVEN"
              className="h-20 w-auto object-contain drop-shadow-[0_0_12px_rgba(255,140,26,0.25)]"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <span className="font-display font-bold text-xl tracking-tight">
              SEVEN <span className="text-primary">Tools</span>
            </span>
          </div>

          {/* Title with rotating word */}
          <h1 className="font-display font-extrabold text-5xl md:text-7xl tracking-tighter leading-tight">
            <span>Ferramentas comerciais</span>
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

          <Link to="/login">
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

// ─── Product Section (ContainerScroll) ───────────────────────────────────────

function ProductSection() {
  return (
    <section className="bg-background">
      <ContainerScroll
        titleComponent={
          <div className="mb-4">
            <h2 className="font-display font-bold text-4xl md:text-5xl">
              Conheça o Hub{' '}
              <span className="text-primary">por dentro</span>
            </h2>
          </div>
        }
      >
        {/* Stylized dashboard mockup */}
        <div className="w-full h-full bg-background p-4 md:p-6 flex flex-col gap-4">
          {/* Mock nav */}
          <div className="flex items-center justify-between border-b border-border/30 pb-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-primary/20" />
              <span className="font-display font-bold text-sm text-foreground">SEVEN Tools</span>
            </div>
            <div className="flex gap-2">
              <div className="h-6 w-16 rounded bg-muted" />
              <div className="h-6 w-16 rounded bg-muted" />
            </div>
          </div>

          {/* Mock greeting */}
          <div className="space-y-2">
            <div className="h-4 w-48 rounded bg-primary/10" />
            <div className="h-8 w-80 rounded bg-muted" />
          </div>

          {/* Mock module grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
            {MODULES.map((mod) => (
              <div
                key={mod.name}
                className="rounded-xl border border-border/30 bg-card p-4 flex flex-col items-center gap-2"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <mod.icon className="h-5 w-5" />
                </div>
                <span className="font-display font-semibold text-xs text-foreground">{mod.name}</span>
                <span className="text-[10px] text-muted-foreground text-center leading-tight">{mod.description}</span>
                <span className="mt-auto inline-block rounded-full bg-primary/10 text-primary text-[9px] font-bold px-2 py-0.5 uppercase">
                  Novo
                </span>
              </div>
            ))}
          </div>
        </div>
      </ContainerScroll>
    </section>
  );
}

// ─── Tools Section ───────────────────────────────────────────────────────────

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

        {/* Featured tools */}
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
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Modules grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {MODULES.map((mod, i) => (
            <motion.div
              key={mod.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
              className="rounded-xl border border-border/30 bg-card/50 p-4 hover:border-primary/30 transition-all text-center"
            >
              <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
                <mod.icon className="h-5 w-5" />
              </div>
              <h4 className="font-display font-semibold text-sm mb-1">{mod.name}</h4>
              <p className="text-xs text-muted-foreground">{mod.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Method Section (RadialOrbitalTimeline) ──────────────────────────────────

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

// ─── CTA Section ─────────────────────────────────────────────────────────────

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
            <Link to="/login">
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

// ─── Landing Page ────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="bg-background text-foreground">
      <HeroSection />
      <ProductSection />
      <ToolsSection />
      <MethodSection />
      <CtaSection />
    </div>
  );
}
```

- [ ] **Step 2: Verify file exists**

Run: `ls src/pages/LandingPage.tsx`
Expected: file listed.

---

### Task 4: Add public route to App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add LandingPage import**

At the top of `src/App.tsx`, after the existing imports (after line 18 — the `NotFound` import), add:

```tsx
import LandingPage from "./pages/LandingPage.tsx";
```

- [ ] **Step 2: Add public route**

In `src/App.tsx`, add the landing route as a public route. Insert it just before the `{/* Public-only */}` comment block (before line 39), as a direct child of `<Routes>`:

```tsx
            {/* Public landing page */}
            <Route path="/landing" element={<LandingPage />} />
```

- [ ] **Step 3: Verify the route structure**

After editing, the `<Routes>` block should look like:

```tsx
          <Routes>
            {/* Public landing page */}
            <Route path="/landing" element={<LandingPage />} />

            {/* Public-only: redirect to / if already logged in */}
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* Protected: ... rest stays the same */}
```

---

### Task 5: Build verification and commit

- [ ] **Step 1: Run build**

Run: `cd seven_tools_front && npx vite build 2>&1 | tail -10`
Expected: Build completes with no errors.

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/radial-orbital-timeline.tsx src/components/ui/container-scroll-animation.tsx src/pages/LandingPage.tsx src/App.tsx
git commit -m "feat: add public landing page with animated hero, 3D scroll and orbital timeline"
```
