import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AgentHeader } from '../AgentHeader';

describe('AgentHeader', () => {
  it('renderiza um status discreto e aceita shell interno customizado', () => {
    render(
      <AgentHeader
        name="Caloni"
        subtitle="Decisor Comercial Assistido"
        status="thinking"
        contentClassName="max-w-[960px]"
      />,
    );

    expect(screen.getByText('Analisando')).toBeInTheDocument();
    expect(screen.getByTestId('agent-header-shell').className).toContain('max-w-[960px]');
  });
});
