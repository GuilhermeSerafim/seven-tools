import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ChatDemoControls } from './ChatDemoControls';

const props = {
  disabled: false,
  manualStreaming: false,
  onReset: vi.fn(),
  onSimulateError: vi.fn(),
  onToggleDisabled: vi.fn(),
  onToggleManualStreaming: vi.fn(),
};

describe('ChatDemoControls', () => {
  it('mantem o header mobile compacto e reserva controles completos para desktop', () => {
    render(<ChatDemoControls {...props} />);

    const desktopControls = screen.getByTestId('chat-demo-controls-desktop');
    const mobileControls = screen.getByTestId('chat-demo-controls-mobile');

    expect(desktopControls.className).toContain('hidden');
    expect(desktopControls.className).toContain('md:flex');
    expect(mobileControls.className).toContain('md:hidden');
    expect(screen.getByRole('button', { name: 'Abrir ajustes' })).toBeInTheDocument();
    expect(screen.queryByText('Demo')).not.toBeInTheDocument();
    expect(screen.queryByText('pure')).not.toBeInTheDocument();
    expect(screen.queryByText('split')).not.toBeInTheDocument();
  });
});
