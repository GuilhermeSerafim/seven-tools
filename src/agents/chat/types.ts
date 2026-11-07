import type { ReactNode } from 'react';

export type AttachmentType = 'image' | 'pdf' | 'text';

export interface Attachment {
  id: string;
  type: AttachmentType;
  file: File;
  name: string;
  sizeBytes: number;
  previewUrl?: string;
}

export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageVariant = 'default' | 'error' | 'info' | 'interrupted';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: ReactNode;
  attachments?: Attachment[];
  createdAt: number;
  variant?: MessageVariant;
  payload?: unknown;
}

export interface Suggestion {
  label: string;
  action:
    | { kind: 'prefill'; text: string }
    | { kind: 'open-proposal-picker' }
    | { kind: 'open-file-picker' };
}
