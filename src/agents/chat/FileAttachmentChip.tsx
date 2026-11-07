import { FileText, FileType, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatBytes } from './utils';
import type { Attachment } from './types';

export interface FileAttachmentChipProps {
  readonly attachment: Attachment;
  readonly onRemove?: () => void;
  readonly onClick?: () => void;
  readonly size?: 'sm' | 'md';
  readonly className?: string;
}

function getAttachmentKindLabel(attachment: Attachment): 'PDF' | 'texto' {
  return attachment.type === 'pdf' ? 'PDF' : 'texto';
}

function getChipLabel(attachment: Attachment): string | undefined {
  if (attachment.type === 'image') {
    return undefined;
  }

  return `Anexo ${getAttachmentKindLabel(attachment)}: ${attachment.name}, ${formatBytes(attachment.sizeBytes)}`;
}

function AttachmentContent({
  attachment,
  thumbSize,
}: Readonly<{ attachment: Attachment; thumbSize: string }>) {
  if (attachment.type === 'image' && attachment.previewUrl) {
    return (
      <div className={cn('overflow-hidden rounded-xl bg-muted', thumbSize)}>
        <img src={attachment.previewUrl} alt={attachment.name} className="h-full w-full object-cover" />
      </div>
    );
  }

  const Icon = attachment.type === 'pdf' ? FileText : FileType;

  return (
    <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
      <div className="flex flex-col">
        <span className="max-w-[140px] truncate text-xs text-foreground">{attachment.name}</span>
        <span className="text-[10px] text-muted-foreground">{formatBytes(attachment.sizeBytes)}</span>
      </div>
    </div>
  );
}

export function FileAttachmentChip({
  attachment,
  onRemove,
  onClick,
  size = 'md',
  className,
}: FileAttachmentChipProps) {
  const thumbSize = size === 'sm' ? 'h-10 w-10' : 'h-16 w-16';
  const openLabel = `Abrir anexo ${attachment.name}`;
  const removeLabel = `Remover anexo ${attachment.name}`;
  const chipLabel = getChipLabel(attachment);

  const content = <AttachmentContent attachment={attachment} thumbSize={thumbSize} />;

  return (
    <fieldset
      className={cn(
        'relative m-0 inline-flex border-0 p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        className,
      )}
      aria-label={chipLabel}
    >
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          aria-label={openLabel}
          className={cn(
            'rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            attachment.type === 'image' && attachment.previewUrl ? thumbSize : 'inline-flex',
          )}
        >
          {content}
        </button>
      ) : (
        content
      )}

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className={cn(
            'absolute -right-1 -top-1 rounded-full bg-background p-0.5 shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            attachment.type === 'image' && attachment.previewUrl ? 'translate-x-1 -translate-y-1' : '',
          )}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </fieldset>
  );
}
