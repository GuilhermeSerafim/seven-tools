import type { SVGProps } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { Tool } from '@/data/types';
import { ToolCard } from './ToolCard';

vi.mock('./FavoriteButton', () => ({
  FavoriteButton: () => (
    <button aria-label="Adicionar aos favoritos" type="button">
      Favorite
    </button>
  ),
}));

vi.mock('@/lib/iconRegistry', () => ({
  getIconByName: () => (props: SVGProps<SVGSVGElement>) => <svg aria-hidden="true" data-testid="tool-icon" {...props} />,
}));

const tool: Tool = {
  id: '20',
  name: 'Agente de Diagnostico Comercial Caloni',
  slug: 'diagnostico-comercial-caloni',
  shortDescription: 'Descubra o que esta travando suas vendas com um diagnostico direto do Caloni.',
  longDescription: 'Diagnostico comercial em blocos executivos.',
  category: 'comercial',
  status: 'new',
  tags: ['diagnostico', 'comercial', 'caloni'],
  icon: 'ScanSearch',
  mainBenefit: 'Diagnostico de causa-raiz para o time comercial.',
  accessType: 'Plataforma Web',
  recommendationLevel: 5,
  popularity: 74,
  isFavorite: false,
  launchDate: '2025-03-25',
};

describe('ToolCard', () => {
  it('keeps the status actions anchored in the header while still protecting mobile width', () => {
    const { container } = render(
      <MemoryRouter>
        <ToolCard tool={tool} />
      </MemoryRouter>,
    );

    const content = container.querySelector('a > div.relative');

    if (!(content instanceof HTMLDivElement)) {
      throw new Error('ToolCard content wrapper not found.');
    }

    const header = content.firstElementChild;
    const footer = content.lastElementChild;
    const title = screen.getByRole('heading', { name: /agente de diagnostico comercial caloni/i });

    if (!(header instanceof HTMLDivElement)) {
      throw new Error('ToolCard header wrapper not found.');
    }

    if (!(footer instanceof HTMLDivElement)) {
      throw new Error('ToolCard footer wrapper not found.');
    }

    const headingGroup = header.firstElementChild;
    const actionsGroup = header.lastElementChild;

    if (!(headingGroup instanceof HTMLDivElement)) {
      throw new Error('ToolCard heading group not found.');
    }

    if (!(actionsGroup instanceof HTMLDivElement)) {
      throw new Error('ToolCard actions group not found.');
    }

    expect(header).toHaveClass('justify-between');
    expect(header).not.toHaveClass('flex-wrap');
    expect(headingGroup).toHaveClass('min-w-0', 'flex-1');
    expect(actionsGroup).not.toHaveClass('ml-auto');
    expect(title).toHaveClass('line-clamp-2', 'break-words', 'sm:line-clamp-1');
    expect(footer).toHaveClass('flex-wrap');
  });
});
