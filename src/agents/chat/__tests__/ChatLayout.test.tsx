import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ChatLayout, useChatLayoutMode } from '../ChatLayout';

function ModeProbe() {
  const mode = useChatLayoutMode();
  return <div data-testid="layout-mode">{mode}</div>;
}

describe('ChatLayout (pure)', () => {
  it('modo pure: a coluna interna ocupa toda a altura e controla as 3 linhas', () => {
    const { container } = render(
      <ChatLayout mode="pure">
        <div data-role="header">H</div>
        <div data-role="list">L</div>
        <div data-role="input">I</div>
      </ChatLayout>,
    );
    const root = container.firstChild as HTMLElement;
    const inner = container.querySelector('[data-layout="pure-inner"]')!;

    expect(root.className).not.toMatch(/grid-rows-\[auto_1fr_auto\]/);
    expect(inner.className).toMatch(/\bh-full\b/);
    expect(inner.className).toMatch(/\bmin-h-0\b/);
    expect(inner.className).toMatch(/grid-rows-\[auto_minmax\(0,1fr\)_auto\]/);
  });

  it('modo pure: aplica max-width 760px na coluna central', () => {
    const { container } = render(
      <ChatLayout mode="pure">
        <div />
      </ChatLayout>,
    );
    const inner = container.querySelector('[data-layout="pure-inner"]')!;
    expect(inner.className).toMatch(/mx-auto/);
    expect(inner.className).toMatch(/w-full/);
    expect(inner.className).toMatch(/max-w-\[760px\]/);
    expect(inner.className).not.toMatch(/\bcontents\b/);
    expect(inner.className).toMatch(/\bgrid\b/);
    expect(inner.className).toMatch(/\bh-full\b/);
  });
});

describe('ChatLayout (split)', () => {
  beforeEach(() => {
    mockMatchMedia(true);
  });

  it('modo split desktop: renderiza painel, divisor e artefato', () => {
    const { container } = render(
      <ChatLayout mode="split">
        <ChatLayout.Panel>
          <div>PANEL</div>
        </ChatLayout.Panel>
        <ChatLayout.Divider />
        <ChatLayout.Artifact>
          <div>ART</div>
        </ChatLayout.Artifact>
      </ChatLayout>,
    );

    expect(container.querySelector('[data-layout="split-panel"]')).toBeTruthy();
    expect(container.querySelector('[data-layout="split-artifact"]')).toBeTruthy();
  });

  it('modo split: fornece contexto split para consumidores', () => {
    render(
      <ChatLayout mode="split">
        <ChatLayout.Panel>
          <ModeProbe />
        </ChatLayout.Panel>
        <ChatLayout.Divider />
        <ChatLayout.Artifact>
          <div />
        </ChatLayout.Artifact>
      </ChatLayout>,
    );

    expect(screen.getByTestId('layout-mode').textContent).toBe('split');
  });

  it('modo split desktop: usa tamanhos iniciais estaveis e delega persistencia ao painel', () => {
    const { container } = render(
      <ChatLayout mode="split">
        <ChatLayout.Panel>
          <div />
        </ChatLayout.Panel>
        <ChatLayout.Divider />
        <ChatLayout.Artifact>
          <div />
        </ChatLayout.Artifact>
      </ChatLayout>,
    );

    expect((container.querySelector('[data-layout="split-panel"]') as HTMLElement)?.dataset.defaultSize).toBe('60');
    expect((container.querySelector('[data-layout="split-artifact"]') as HTMLElement)?.dataset.defaultSize).toBe('40');
  });

  it('modo split mobile: abre Sheet com titulo acessivel', () => {
    mockMatchMedia(false);

    render(
      <ChatLayout mode="split">
        <ChatLayout.Panel>
          <div>PANEL</div>
        </ChatLayout.Panel>
        <ChatLayout.Divider />
        <ChatLayout.Artifact>
          <div>ART</div>
        </ChatLayout.Artifact>
      </ChatLayout>,
    );

    const artifactTrigger = screen.getByRole('button', { name: 'Abrir painel de artefato' });
    expect(artifactTrigger).toHaveTextContent('Preview');
    expect(artifactTrigger.className).toContain('absolute');
    expect(artifactTrigger.className).toContain('top-[4.25rem]');
    expect(artifactTrigger.className).not.toContain('fixed');

    fireEvent.click(artifactTrigger);

    const dialog = screen.getByRole('dialog', { name: 'Painel de artefato' });
    expect(dialog).toBeTruthy();
    expect(dialog.className).toContain('sm:max-w-[90vw]');
  });
});

function mockMatchMedia(isDesktop: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (q: string) => ({
      matches: isDesktop && q.includes('min-width: 768px'),
      media: q,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
