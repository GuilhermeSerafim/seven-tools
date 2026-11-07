import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StreamingIndicator } from '../StreamingIndicator';

describe('StreamingIndicator', () => {
  it('renderiza label default', () => {
    render(<StreamingIndicator />);
    expect(screen.getByText(/pensando/i)).toBeInTheDocument();
  });

  it('aceita label custom', () => {
    render(<StreamingIndicator label="Analisando PDF..." />);
    expect(screen.getByText('Analisando PDF...')).toBeInTheDocument();
  });

  it('renderiza 3 pontos', () => {
    const { container } = render(<StreamingIndicator />);
    expect(container.querySelectorAll('[data-dot]')).toHaveLength(3);
  });

  it('usa pulse e motion-reduce no default', () => {
    const { container } = render(<StreamingIndicator />);
    const dots = container.querySelectorAll('[data-dot]');

    expect(dots).toHaveLength(3);
    expect(dots[0].className).toContain('motion-safe:animate-pulse');
    expect(dots[1].className).toContain('motion-safe:animate-pulse');
    expect(dots[2].className).toContain('motion-safe:animate-pulse');
    expect(dots[0].className).toContain('motion-reduce:animate-none');
    expect(dots[1].className).toContain('motion-reduce:animate-none');
    expect(dots[2].className).toContain('motion-reduce:animate-none');
    expect(dots[0]).toHaveStyle({ animationDelay: '0ms' });
    expect(dots[1]).toHaveStyle({ animationDelay: '150ms' });
    expect(dots[2]).toHaveStyle({ animationDelay: '300ms' });
  });

  it('mantem dots estaticos quando variant e dots', () => {
    const { container } = render(<StreamingIndicator variant="dots" />);
    const dots = container.querySelectorAll('[data-dot]');

    expect(dots).toHaveLength(3);
    for (const dot of dots) {
      expect(dot.classList.contains('motion-safe:animate-pulse')).toBe(false);
      expect(dot.classList.contains('motion-safe:animate-bounce')).toBe(false);
      expect(dot.classList.contains('motion-reduce:animate-none')).toBe(false);
    }
  });
});
