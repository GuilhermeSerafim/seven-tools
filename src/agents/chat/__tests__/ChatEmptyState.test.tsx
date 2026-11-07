import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatEmptyState } from '../ChatEmptyState';
import type { Suggestion } from '../types';

describe('ChatEmptyState', () => {
  it('renderiza nome e missão', () => {
    render(<ChatEmptyState agentName="Caloni" agentMission="Decisor Comercial" />);
    expect(screen.getByText('Caloni')).toBeInTheDocument();
    expect(screen.getByText('Decisor Comercial')).toBeInTheDocument();
  });

  it('renderiza suggestion pills e dispara onPick com a Suggestion inteira', () => {
    const onPick = vi.fn();
    const suggestions: Suggestion[] = [
      { label: 'Diagnóstico', action: { kind: 'prefill', text: 'Diagnostica meu negócio' } },
      { label: 'Proposta salva', action: { kind: 'open-proposal-picker' } },
      { label: 'PDF externo', action: { kind: 'open-file-picker' } },
    ];
    render(<ChatEmptyState agentName="Caloni" suggestions={suggestions} onPick={onPick} />);

    fireEvent.click(screen.getByRole('button', { name: 'Diagnóstico' }));
    expect(onPick).toHaveBeenCalledWith(suggestions[0]);

    fireEvent.click(screen.getByRole('button', { name: 'Proposta salva' }));
    expect(onPick).toHaveBeenCalledWith(suggestions[1]);

    fireEvent.click(screen.getByRole('button', { name: 'PDF externo' }));
    expect(onPick).toHaveBeenCalledWith(suggestions[2]);
  });

  it('sem suggestions: não renderiza lista', () => {
    render(<ChatEmptyState agentName="Caloni" />);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
