import { describe, expect, it } from 'vitest';
import { formatBytes, validateAttachment } from '../utils';

describe('formatBytes', () => {
  it('formata bytes em KB/MB com 1 casa decimal', () => {
    expect(formatBytes(500)).toBe('500 B');
    expect(formatBytes(1_500)).toBe('1.5 KB');
    expect(formatBytes(2_500_000)).toBe('2.5 MB');
  });

  it('trata 0 bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
  });
});

describe('validateAttachment', () => {
  const makeFile = (name: string, size: number, type: string) => {
    const file = new File([new Uint8Array(size)], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
  };

  it('aceita imagem ate 10MB', () => {
    const file = makeFile('foto.png', 9 * 1024 * 1024, 'image/png');
    expect(validateAttachment(file)).toEqual({ ok: true, type: 'image' });
  });

  it('rejeita imagem > 10MB', () => {
    const file = makeFile('foto.png', 11 * 1024 * 1024, 'image/png');
    const result = validateAttachment(file);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/imagem/i);
      expect(result.reason).toContain('10 MB');
    }
  });

  it('aceita PDF ate 20MB', () => {
    const file = makeFile('doc.pdf', 15 * 1024 * 1024, 'application/pdf');
    expect(validateAttachment(file)).toEqual({ ok: true, type: 'pdf' });
  });

  it('rejeita PDF > 20MB', () => {
    const file = makeFile('doc.pdf', 25 * 1024 * 1024, 'application/pdf');
    const result = validateAttachment(file);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('20 MB');
  });

  it('aceita texto (txt/md) ate 1MB', () => {
    const txt = makeFile('a.txt', 500_000, 'text/plain');
    const md = makeFile('a.md', 500_000, 'text/markdown');
    expect(validateAttachment(txt)).toEqual({ ok: true, type: 'text' });
    expect(validateAttachment(md)).toEqual({ ok: true, type: 'text' });
  });

  it('aceita texto txt/md com MIME vazio baseado na extensao', () => {
    const txt = makeFile('a.txt', 500_000, '');
    const md = makeFile('a.md', 500_000, '');
    expect(validateAttachment(txt)).toEqual({ ok: true, type: 'text' });
    expect(validateAttachment(md)).toEqual({ ok: true, type: 'text' });
  });

  it('rejeita texto > 1MB', () => {
    const file = makeFile('big.txt', 2 * 1024 * 1024, 'text/plain');
    expect(validateAttachment(file).ok).toBe(false);
  });

  it('rejeita tipos nao suportados', () => {
    const file = makeFile('video.mp4', 1024, 'video/mp4');
    const result = validateAttachment(file);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/nao suportado/i);
  });
});
