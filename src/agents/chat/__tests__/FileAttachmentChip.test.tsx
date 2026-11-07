import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileAttachmentChip } from '../FileAttachmentChip';
import type { Attachment } from '../types';

const makeAtt = (overrides: Partial<Attachment> = {}): Attachment => ({
  id: 'a1',
  type: 'pdf',
  file: new File([''], 'doc.pdf', { type: 'application/pdf' }),
  name: 'doc.pdf',
  sizeBytes: 2_500_000,
  ...overrides,
});

describe('FileAttachmentChip', () => {
  it('image renders thumb with alt', () => {
    const att = makeAtt({ type: 'image', previewUrl: 'blob:fake', name: 'foto.png' });
    render(<FileAttachmentChip attachment={att} />);
    const img = screen.getByRole('img', { name: 'foto.png' });
    expect(img).toHaveAttribute('src', 'blob:fake');
  });

  it('PDF renders name and formatted size', () => {
    render(<FileAttachmentChip attachment={makeAtt()} />);
    expect(screen.getByText('doc.pdf')).toBeInTheDocument();
    expect(screen.getByText('2.5 MB')).toBeInTheDocument();
  });

  it('PDF has descriptive aria-label', () => {
    const { container } = render(<FileAttachmentChip attachment={makeAtt()} />);
    expect(container.firstElementChild).toHaveAttribute('aria-label', 'Anexo PDF: doc.pdf, 2.5 MB');
  });

  it('onRemove shows accessible button and fires callback', () => {
    const onRemove = vi.fn();
    render(<FileAttachmentChip attachment={makeAtt()} onRemove={onRemove} />);
    fireEvent.click(screen.getByRole('button', { name: /remover anexo/i }));
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it('without onRemove: remove button does not appear (read-only)', () => {
    render(<FileAttachmentChip attachment={makeAtt()} />);
    expect(screen.queryByRole('button', { name: /remover/i })).not.toBeInTheDocument();
  });

  it('onClick fires callback (open preview)', () => {
    const onClick = vi.fn();
    render(<FileAttachmentChip attachment={makeAtt()} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button', { name: /abrir anexo/i }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('onClick without onRemove does not create extra tab stop on wrapper', () => {
    const { container } = render(<FileAttachmentChip attachment={makeAtt()} onClick={vi.fn()} />);
    expect(container.firstElementChild).not.toHaveAttribute('tabindex');
  });

  it('onRemove does not create an artificial tab stop on the wrapper', () => {
    const { container } = render(<FileAttachmentChip attachment={makeAtt()} onRemove={vi.fn()} />);

    expect(container.firstElementChild).not.toHaveAttribute('tabindex');
  });

  it('Backspace or Delete on the open button does not remove when onClick and onRemove coexist', () => {
    const onRemove = vi.fn();
    render(<FileAttachmentChip attachment={makeAtt()} onClick={vi.fn()} onRemove={onRemove} />);

    fireEvent.keyDown(screen.getByRole('button', { name: /abrir anexo/i }), { key: 'Delete' });
    fireEvent.keyDown(screen.getByRole('button', { name: /abrir anexo/i }), { key: 'Backspace' });

    expect(onRemove).not.toHaveBeenCalled();
  });
});
