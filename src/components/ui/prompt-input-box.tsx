import React from "react";
import { ArrowUp, FileText, Paperclip, Square, X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { Attachment, AttachmentType } from "@/agents/chat/types";
import { makeAttachmentId, validateAttachment } from "@/agents/chat/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const DEFAULT_MAX_FILES = 5;
const DEFAULT_ACCEPTED_TYPES: AttachmentType[] = ["image", "pdf", "text"];
const ACCEPT_ATTRIBUTE_BY_TYPE: Record<AttachmentType, string> = {
  image: "image/*",
  pdf: "application/pdf",
  text: "text/plain,text/markdown,.md,.txt",
};
const shortcutOwners = new Set<number>();
let nextShortcutOwnerId = 0;

function getLatestShortcutOwnerId() {
  let latestOwnerId = -1;
  shortcutOwners.forEach((ownerId) => {
    if (ownerId > latestOwnerId) {
      latestOwnerId = ownerId;
    }
  });
  return latestOwnerId;
}

// ImageViewDialog Component
interface ImageViewDialogProps {
  imageUrl: string | null;
  onClose: () => void;
}
const ImageViewDialog: React.FC<ImageViewDialogProps> = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;
  return (
    <Dialog open={!!imageUrl} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] border-none bg-transparent p-0 shadow-none md:max-w-[800px]">
        <DialogTitle className="sr-only">Image Preview</DialogTitle>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative overflow-hidden rounded-2xl bg-card shadow-premium"
        >
          <img src={imageUrl} alt="Full preview" className="max-h-[80vh] w-full rounded-2xl object-contain" />
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

// PromptInput Context and Components
interface PromptInputContextType {
  isLoading: boolean;
  value: string;
  setValue: (value: string) => void;
  maxHeight: number | string;
  onSubmit?: () => void;
  disabled?: boolean;
}
const PromptInputContext = React.createContext<PromptInputContextType>({
  isLoading: false,
  value: "",
  setValue: () => {},
  maxHeight: 240,
  onSubmit: undefined,
  disabled: false,
});
function usePromptInput() {
  const context = React.useContext(PromptInputContext);
  if (!context) throw new Error("usePromptInput must be used within a PromptInput");
  return context;
}

interface PromptInputProps {
  isLoading?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
  maxHeight?: number | string;
  onSubmit?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}
const PromptInput = React.forwardRef<HTMLFormElement, PromptInputProps>(
  (
    {
      className,
      isLoading = false,
      maxHeight = 240,
      value,
      onValueChange,
      onSubmit,
      children,
      disabled = false,
      onDragOver,
      onDragLeave,
      onDrop,
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState(value || "");
    const handleChange = React.useCallback((newValue: string) => {
      setInternalValue(newValue);
      onValueChange?.(newValue);
    }, [onValueChange]);
    const contextValue = React.useMemo(
      () => ({
        isLoading,
        value: value ?? internalValue,
        setValue: onValueChange ?? handleChange,
        maxHeight,
        onSubmit,
        disabled,
      }),
      [disabled, handleChange, internalValue, isLoading, maxHeight, onSubmit, onValueChange, value]
    );

    return (
      <TooltipProvider>
        <PromptInputContext.Provider value={contextValue}>
          <form
            ref={ref}
            className={cn(
              "rounded-2xl border border-border bg-card p-2 shadow-premium transition-all duration-300",
              isLoading && "border-destructive/70",
              className
            )}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            {children}
          </form>
        </PromptInputContext.Provider>
      </TooltipProvider>
    );
  }
);
PromptInput.displayName = "PromptInput";

interface PromptInputTextareaProps {
  disableAutosize?: boolean;
  placeholder?: string;
  onPaste?: React.ClipboardEventHandler<HTMLTextAreaElement>;
}
const PromptInputTextarea = React.forwardRef<
  HTMLTextAreaElement,
  PromptInputTextareaProps & React.ComponentProps<typeof Textarea>
>(({ className, onKeyDown, onPaste, disableAutosize = false, placeholder, ...props }, ref) => {
  const { value, setValue, maxHeight, onSubmit, disabled, isLoading } = usePromptInput();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const setTextareaRef = React.useCallback(
    (node: HTMLTextAreaElement | null) => {
      textareaRef.current = node;

      if (typeof ref === "function") {
        ref(node);
        return;
      }

      if (ref) {
        ref.current = node;
      }
    },
    [ref]
  );

  React.useEffect(() => {
    if (disableAutosize || !textareaRef.current) return;
    const responsiveMaxHeight = getResponsiveTextareaMaxHeight(maxHeight);
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height =
      typeof responsiveMaxHeight === "number"
        ? `${Math.min(textareaRef.current.scrollHeight, responsiveMaxHeight)}px`
        : `min(${textareaRef.current.scrollHeight}px, ${responsiveMaxHeight})`;
  }, [value, maxHeight, disableAutosize]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit?.();
    }
    onKeyDown?.(e);
  };

  return (
    <Textarea
      ref={setTextareaRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onPaste={onPaste}
      className={cn(
        "min-h-[40px] resize-none border-0 bg-transparent px-2 py-2 text-base leading-6 text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0",
        className
      )}
      disabled={disabled || isLoading}
      placeholder={placeholder}
      rows={1}
      {...props}
    />
  );
});
PromptInputTextarea.displayName = "PromptInputTextarea";

function getResponsiveTextareaMaxHeight(maxHeight: number | string) {
  const isMobile =
    typeof window !== "undefined" && window.matchMedia?.("(max-width: 767px)").matches;

  if (!isMobile) {
    return maxHeight;
  }

  return typeof maxHeight === "number" ? Math.min(maxHeight, 160) : `min(${maxHeight}, 160px)`;
}

function readImagePreviewUrl(file: File): Promise<string | undefined> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      resolve(typeof reader.result === "string" ? reader.result : undefined);
    });
    reader.addEventListener("error", () => resolve(undefined));
    reader.readAsDataURL(file);
  });
}

function resetFileInput(input: HTMLInputElement | null): void {
  if (input) {
    input.value = "";
  }
}

function shouldStopForFileLimit(
  currentCount: number,
  pendingCount: number,
  maxFiles: number,
  autoSendOnFileSelection: boolean
): boolean {
  return !autoSendOnFileSelection && currentCount + pendingCount >= maxFiles;
}

async function createAttachment(file: File, type: AttachmentType): Promise<Attachment> {
  return {
    id: makeAttachmentId(),
    type,
    file,
    name: file.name,
    sizeBytes: file.size,
    previewUrl: type === "image" ? await readImagePreviewUrl(file) : undefined,
  };
}

type PromptInputActionsProps = React.HTMLAttributes<HTMLDivElement>;
const PromptInputActions: React.FC<PromptInputActionsProps> = ({ children, className, ...props }) => (
  <div className={cn("flex items-center gap-2", className)} {...props}>
    {children}
  </div>
);

interface PromptInputActionProps extends React.ComponentProps<typeof Tooltip> {
  tooltip: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  disabled?: boolean;
}
const PromptInputAction: React.FC<PromptInputActionProps> = ({
  tooltip,
  children,
  className,
  side = "top",
  disabled,
  ...props
}) => {
  const { disabled: contextDisabled } = usePromptInput();
  const triggerDisabled = disabled ?? contextDisabled;
  return (
    <Tooltip {...props}>
      <TooltipTrigger asChild disabled={triggerDisabled}>
        {children}
      </TooltipTrigger>
      <TooltipContent side={side} className={className}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
};

// Main PromptInputBox Component
export interface PromptInputBoxProps {
  onSend: (text: string, files: Attachment[]) => void;
  onStop?: () => void;
  isLoading?: boolean;
  placeholder?: string;
  maxFiles?: number;
  acceptedTypes?: AttachmentType[];
  disabled?: boolean;
  autoFocus?: boolean;
  initialValue?: string;
  className?: string;
}

export interface PromptInputBoxHandle {
  setValue: (text: string) => void;
  focus: () => void;
  clear: () => void;
  openFilePicker: (options?: { autoSend?: boolean }) => void;
}

export const PromptInputBox = React.forwardRef<PromptInputBoxHandle, PromptInputBoxProps>(
  (
    {
      onSend,
      onStop,
      isLoading = false,
      placeholder = "Digite uma mensagem...",
      maxFiles = DEFAULT_MAX_FILES,
      acceptedTypes = DEFAULT_ACCEPTED_TYPES,
      disabled = false,
      autoFocus = true,
      initialValue = "",
      className,
    },
    ref
  ) => {
    const [input, setInput] = React.useState(initialValue);
    const [attachments, setAttachments] = React.useState<Attachment[]>([]);
    const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
    const uploadInputRef = React.useRef<HTMLInputElement>(null);
    const autoSendOnNextFileRef = React.useRef(false);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const attachmentsRef = React.useRef<Attachment[]>([]);
    const shortcutOwnerIdRef = React.useRef(++nextShortcutOwnerId);
    const isComposerDisabled = disabled || isLoading;
    const canStop = isLoading && typeof onStop === "function";
    const canUseShortcut = !disabled && !isLoading;
    const acceptAttribute = acceptedTypes.map((type) => ACCEPT_ATTRIBUTE_BY_TYPE[type]).join(",");

    React.useEffect(() => {
      attachmentsRef.current = attachments;
    }, [attachments]);

    React.useEffect(() => {
      return () => {
        attachmentsRef.current.forEach((attachment) => {
          if (attachment.previewUrl?.startsWith("blob:")) {
            URL.revokeObjectURL(attachment.previewUrl);
          }
        });
      };
    }, []);

    const revokePreviewUrl = React.useCallback((attachment: Attachment) => {
      if (attachment.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(attachment.previewUrl);
      }
    }, []);

    const clearComposer = React.useCallback((options?: { revokePreviews?: boolean }) => {
      const revokePreviews = options?.revokePreviews ?? true;
      if (revokePreviews) {
        attachmentsRef.current.forEach(revokePreviewUrl);
      }

      attachmentsRef.current = [];
      setInput("");
      setAttachments([]);
      setSelectedImage(null);
      if (uploadInputRef.current) {
        uploadInputRef.current.value = "";
      }
    }, [revokePreviewUrl]);

    React.useImperativeHandle(
      ref,
      () => ({
        setValue: (text: string) => {
          setInput(text);
        },
        focus: () => {
          textareaRef.current?.focus();
        },
        clear: () => {
          clearComposer();
        },
        openFilePicker: (options?: { autoSend?: boolean }) => {
          autoSendOnNextFileRef.current = options?.autoSend === true;
          uploadInputRef.current?.click();
        },
      }),
      [clearComposer]
    );

    React.useEffect(() => {
      if (!autoFocus) {
        return;
      }

      textareaRef.current?.focus();
    }, [autoFocus]);

    React.useEffect(() => {
      const supportsDesktopPointer = window.matchMedia?.("(pointer: fine)").matches ?? false;
      if (!supportsDesktopPointer || !canUseShortcut) {
        return;
      }

      const ownerId = shortcutOwnerIdRef.current;
      shortcutOwners.add(ownerId);

      const handleGlobalShortcut = (event: KeyboardEvent) => {
        if (ownerId !== getLatestShortcutOwnerId()) {
          return;
        }

        if (event.key !== "/" || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
          return;
        }

        const target = event.target instanceof HTMLElement ? event.target : null;
        const targetTag = target?.tagName;
        const isEditableTarget =
          target?.isContentEditable ||
          targetTag === "INPUT" ||
          targetTag === "TEXTAREA" ||
          target?.closest('[contenteditable="true"]');

        if (isEditableTarget) {
          return;
        }

        if (!textareaRef.current || textareaRef.current.disabled) {
          return;
        }

        event.preventDefault();
        textareaRef.current?.focus();
      };

      window.addEventListener("keydown", handleGlobalShortcut);
      return () => {
        window.removeEventListener("keydown", handleGlobalShortcut);
        shortcutOwners.delete(ownerId);
      };
    }, [canUseShortcut]);

    const addFiles = React.useCallback(async (filesToAdd: File[], autoSendOnFileSelection: boolean) => {
      autoSendOnNextFileRef.current = false;
      if (isComposerDisabled || filesToAdd.length === 0) {
        return;
      }

      const acceptedAttachments: Attachment[] = [];

      for (const file of filesToAdd) {
        const result = validateAttachment(file);
        if (!result.ok) {
          toast.error(result.reason);
          continue;
        }

        if (!acceptedTypes.includes(result.type)) {
          toast.error("Tipo de arquivo nao suportado neste campo.");
          continue;
        }

        if (
          shouldStopForFileLimit(
            attachmentsRef.current.length,
            acceptedAttachments.length,
            maxFiles,
            autoSendOnFileSelection
          )
        ) {
          toast.error(`Maximo de ${maxFiles} anexos por mensagem.`);
          break;
        }

        const attachment = await createAttachment(file, result.type);

        if (autoSendOnFileSelection) {
          resetFileInput(uploadInputRef.current);
          onSend("", [attachment]);
          return;
        }

        acceptedAttachments.push(attachment);
      }

      if (acceptedAttachments.length > 0) {
        attachmentsRef.current = [...attachmentsRef.current, ...acceptedAttachments];
        setAttachments((currentAttachments) => [...currentAttachments, ...acceptedAttachments]);
      }
    }, [acceptedTypes, isComposerDisabled, maxFiles, onSend]);

    const handleFileInputChange = React.useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const shouldAutoSend = autoSendOnNextFileRef.current;
        addFiles(Array.from(event.target.files ?? []), shouldAutoSend).catch(() => undefined);
        resetFileInput(event.target);
      },
      [addFiles]
    );

    const handleAttachmentButtonClick = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      if (!(event.target instanceof HTMLInputElement)) {
        autoSendOnNextFileRef.current = false;
      }

      if (uploadInputRef.current) {
        uploadInputRef.current.click();
      }
    }, []);

    const handleSubmit = React.useCallback(() => {
      const trimmedInput = input.trim();
      const payload = attachmentsRef.current.map((attachment) => ({ ...attachment }));

      if (!trimmedInput && payload.length === 0) {
        return;
      }

      onSend(trimmedInput, payload);
      clearComposer({ revokePreviews: false });
    }, [clearComposer, input, onSend]);

    const handleStop = React.useCallback(() => {
      onStop?.();
    }, [onStop]);

    const handleDragOver = React.useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    }, []);

    const handleDragLeave = React.useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    }, []);

    const handleDrop = React.useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        addFiles(Array.from(e.dataTransfer.files), false).catch(() => undefined);
      },
      [addFiles]
    );

    const removeAttachment = React.useCallback((id: string) => {
      const targetAttachment = attachmentsRef.current.find((attachment) => attachment.id === id);
      if (!targetAttachment) {
        return;
      }

      revokePreviewUrl(targetAttachment);
      attachmentsRef.current = attachmentsRef.current.filter((attachment) => attachment.id !== id);
      setAttachments((currentAttachments) => currentAttachments.filter((attachment) => attachment.id !== id));

      if (targetAttachment.previewUrl) {
        setSelectedImage((currentImage) => (currentImage === targetAttachment.previewUrl ? null : currentImage));
      }
    }, [revokePreviewUrl]);

    const openImageModal = (imageUrl: string) => setSelectedImage(imageUrl);

    const handlePaste = React.useCallback(
      (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const pastedFiles = Array.from(e.clipboardData.files);
        if (pastedFiles.length === 0) {
          return;
        }

        e.preventDefault();
        addFiles(pastedFiles, false).catch(() => undefined);
      },
      [addFiles]
    );


    const hasContent = input.trim() !== "" || attachments.length > 0;

    const getChipLabel = (type: AttachmentType) => (type === "pdf" ? "PDF" : "Texto");

    return (
      <>
        <PromptInput
          value={input}
          onValueChange={setInput}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          className={cn("w-full ease-in-out", className)}
          disabled={disabled}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 p-0 pb-1 transition-all duration-300">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="group relative">
                  {attachment.type === "image" && attachment.previewUrl ? (
                    <button
                      type="button"
                      className="h-16 w-16 overflow-hidden rounded-xl transition-all duration-300"
                      onClick={() => openImageModal(attachment.previewUrl!)}
                      aria-label={`Abrir preview de ${attachment.name}`}
                    >
                      <img
                        src={attachment.previewUrl}
                        alt={attachment.name}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ) : (
                    <div className="flex min-w-[160px] max-w-[220px] items-center gap-2 rounded-xl border border-border bg-muted/70 px-3 py-2 pr-9 text-left shadow-sm">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground">
                        <FileText className="h-4 w-4" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{attachment.name}</p>
                        <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                          {getChipLabel(attachment.type)}
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAttachment(attachment.id);
                    }}
                    className="absolute right-1 top-1 rounded-full bg-background/80 p-0.5 opacity-100 transition-opacity hover:bg-background"
                    aria-label={`Remover anexo ${attachment.name}`}
                  >
                    <X className="h-3 w-3 text-foreground" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div
            data-testid="prompt-input-main-row"
            className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-end gap-1"
          >
            <PromptInputActions className="h-10 items-center p-0">
              <PromptInputAction tooltip="Anexar arquivos">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleAttachmentButtonClick}
                  className="h-8 w-8 cursor-pointer rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  disabled={isComposerDisabled}
                  aria-label="Anexar arquivos"
                >
                  <Paperclip className="h-5 w-5 transition-colors" />
                  <input
                    ref={uploadInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileInputChange}
                    accept={acceptAttribute}
                    multiple
                  />
                </Button>
              </PromptInputAction>
            </PromptInputActions>

            <div className="min-w-0 opacity-100 transition-all duration-300">
              <PromptInputTextarea
                ref={textareaRef}
                placeholder={placeholder}
                className="text-base"
                onPaste={handlePaste}
                autoFocus={autoFocus}
              />
            </div>

            <PromptInputActions className="h-10 items-center justify-end p-0">
              {canStop ? (
                <PromptInputAction key="stop" tooltip="Parar resposta" disabled={false}>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8 rounded-full transition-all duration-200"
                    onClick={handleStop}
                    aria-label="Parar resposta"
                  >
                    <Square className="h-4 w-4 fill-current" />
                  </Button>
                </PromptInputAction>
              ) : (
                <PromptInputAction key="send" tooltip="Enviar mensagem">
                  <Button
                    type="button"
                    variant={hasContent ? "default" : "ghost"}
                    size="icon"
                    className={cn(
                      "h-8 w-8 rounded-full transition-all duration-200",
                      hasContent
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    onClick={handleSubmit}
                    disabled={disabled || isLoading || !hasContent}
                    aria-label="Enviar mensagem"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                </PromptInputAction>
              )}
            </PromptInputActions>
          </div>
        </PromptInput>

        <ImageViewDialog imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
      </>
    );
  }
);
PromptInputBox.displayName = "PromptInputBox";
