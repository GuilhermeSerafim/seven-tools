import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { FileAttachmentChip } from './FileAttachmentChip';
import { formatBytes } from './utils';
import type { Attachment } from './types';

export interface AttachmentPreviewModalProps {
  attachment: Attachment | null;
  onClose: () => void;
}

export function AttachmentPreviewModal({ attachment, onClose }: AttachmentPreviewModalProps) {
  const open = attachment !== null;
  const [imageZoom, setImageZoom] = useState(1);

  useEffect(() => {
    setImageZoom(1);
  }, [attachment?.id]);

  const isImagePreview = attachment?.type === 'image' && Boolean(attachment.previewUrl);
  const zoomOut = () => setImageZoom((current) => Math.max(0.5, Number((current - 0.25).toFixed(2))));
  const zoomIn = () => setImageZoom((current) => Math.min(3, Number((current + 0.25).toFixed(2))));
  const resetZoom = () => setImageZoom(1);

  const handleDownload = () => {
    if (!attachment) return;

    const isTemporaryUrl = !attachment.previewUrl;
    const url = attachment.previewUrl ?? URL.createObjectURL(attachment.file);
    const a = document.createElement('a');
    a.href = url;
    a.download = attachment.name;
    document.body.appendChild(a);
    a.click();
    a.remove();

    if (isTemporaryUrl) {
      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 0);
    }
  };

  const previewUnavailableLabel =
    attachment?.type === 'pdf'
      ? 'Pré-visualização de PDF indisponível'
      : attachment?.type === 'image'
        ? 'Pré-visualização de imagem indisponível'
        : 'Arquivo de texto';

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{attachment?.name ?? ''}</DialogTitle>
        </DialogHeader>

        {attachment && (
          <div className="flex flex-col items-center gap-4">
            {isImagePreview ? (
              <div className="flex w-full flex-col gap-3">
                <div className="flex items-center justify-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={zoomOut} aria-label="Diminuir zoom da imagem">
                    -
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={resetZoom} aria-label="Redefinir zoom da imagem">
                    {Math.round(imageZoom * 100)}%
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={zoomIn} aria-label="Aumentar zoom da imagem">
                    +
                  </Button>
                </div>
                <div className="max-h-[60vh] max-w-full overflow-auto rounded-xl bg-muted/40 p-2">
                  <img
                    src={attachment.previewUrl}
                    alt={attachment.name}
                    className="block h-auto max-h-[60vh] rounded-lg object-contain"
                    style={{ width: `${imageZoom * 100}%`, maxWidth: 'none' }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 rounded-xl bg-muted p-8 text-center">
                <FileAttachmentChip attachment={attachment} className="pointer-events-none scale-110" />
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">{previewUnavailableLabel}</span>
                  <span className="text-xs text-muted-foreground">{formatBytes(attachment.sizeBytes)}</span>
                </div>
              </div>
            )}

            <Button onClick={handleDownload} variant="outline">
              <Download className="mr-2 h-4 w-4" aria-hidden />
              Baixar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
