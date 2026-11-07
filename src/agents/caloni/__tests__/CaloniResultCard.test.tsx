import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CaloniResultCard } from '../CaloniResultCard';
import type { CalonAnalysis } from '@/services/calonService';

const RESULT: CalonAnalysis = {
  overallScore: 7.8,
  overallLabel: 'Proposta Forte',
  strongPoints: ['Boa abertura'],
  weakPoints: ['Falta prova social'],
  criteria: [{ name: 'Clareza', score: 8, comment: 'Bem estruturada' }],
  suggestions: ['Adicionar cases'],
  analysedAt: Date.now(),
};

describe('CaloniResultCard', () => {
  it('renderiza o resultado como relatorio guiado', () => {
    render(<CaloniResultCard result={RESULT} />);

    expect(screen.getByText('Leitura geral')).toBeInTheDocument();
    expect(screen.getByText('Criterios observados')).toBeInTheDocument();
    expect(screen.getByText('Pontos fortes')).toBeInTheDocument();
    expect(screen.getByText('Pontos de atencao')).toBeInTheDocument();
    expect(screen.getByText('Proximos ajustes recomendados')).toBeInTheDocument();
    expect(screen.getByText('Clareza')).toBeInTheDocument();
    expect(screen.getByText('Bem estruturada')).toBeInTheDocument();
    expect(screen.getByText('Boa abertura')).toBeInTheDocument();
    expect(screen.getByText('Falta prova social')).toBeInTheDocument();
    expect(screen.getByText('Adicionar cases')).toBeInTheDocument();
  });

  it('não renderiza critérios quando array vazio', () => {
    render(<CaloniResultCard result={{ ...RESULT, criteria: [] }} />);
    expect(screen.queryByText('Criterios observados')).not.toBeInTheDocument();
  });

  it('nao renderiza secoes de pontos quando ambos os arrays estao vazios', () => {
    render(<CaloniResultCard result={{ ...RESULT, strongPoints: [], weakPoints: [] }} />);
    expect(screen.queryByText('Pontos fortes')).not.toBeInTheDocument();
    expect(screen.queryByText('Pontos de atencao')).not.toBeInTheDocument();
  });

  it('nao renderiza sugestoes quando array vazio', () => {
    render(<CaloniResultCard result={{ ...RESULT, suggestions: [] }} />);
    expect(screen.queryByText('Proximos ajustes recomendados')).not.toBeInTheDocument();
  });

  it('renderiza apenas o lado fraco quando strongPoints esta vazio', () => {
    render(<CaloniResultCard result={{ ...RESULT, strongPoints: [], weakPoints: ['Falta prova social'] }} />);

    expect(screen.queryByText('Pontos fortes')).not.toBeInTheDocument();
    expect(screen.getByText('Pontos de atencao')).toBeInTheDocument();
    expect(screen.getByText('Falta prova social')).toBeInTheDocument();
  });

  it('renderiza apenas o lado forte quando weakPoints esta vazio', () => {
    render(<CaloniResultCard result={{ ...RESULT, strongPoints: ['Boa abertura'], weakPoints: [] }} />);

    expect(screen.getByText('Pontos fortes')).toBeInTheDocument();
    expect(screen.getByText('Boa abertura')).toBeInTheDocument();
    expect(screen.queryByText('Pontos de atencao')).not.toBeInTheDocument();
  });
});
