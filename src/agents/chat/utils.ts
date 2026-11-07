import type { AttachmentType } from './types';

const MB = 1024 * 1024;
const DISPLAY_MB = 1000 * 1000;

export const ATTACHMENT_LIMITS: Record<AttachmentType, number> = {
  image: 10 * MB,
  pdf: 20 * MB,
  text: 1 * MB,
};

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MB) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / DISPLAY_MB).toFixed(1)} MB`;
}

export type ValidationResult =
  | { ok: true; type: AttachmentType }
  | { ok: false; reason: string };

export function validateAttachment(file: File): ValidationResult {
  const mime = file.type;
  const name = file.name.toLowerCase();
  let type: AttachmentType | null = null;

  if (mime.startsWith('image/')) type = 'image';
  else if (mime === 'application/pdf') type = 'pdf';
  else if (mime === 'text/plain' || mime === 'text/markdown') type = 'text';
  else if (!mime && (name.endsWith('.txt') || name.endsWith('.md'))) type = 'text';

  if (type === null) {
    return { ok: false, reason: `Tipo de arquivo nao suportado: ${mime || 'desconhecido'}.` };
  }

  const limit = ATTACHMENT_LIMITS[type];
  if (file.size > limit) {
    const prettyLimit = `${limit / MB} MB`;
    const label = type === 'image' ? 'imagem' : type === 'pdf' ? 'PDF' : 'texto';
    return { ok: false, reason: `Arquivo de ${label} excede o limite de ${prettyLimit}.` };
  }

  return { ok: true, type };
}

let attachmentIdSequence = 0;

export function makeAttachmentId(): string {
  attachmentIdSequence += 1;
  return `att_${Date.now()}_${attachmentIdSequence}`;
}
