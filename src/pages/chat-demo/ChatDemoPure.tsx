import { useRef, useState } from 'react';

import { AgentHeader, ChatEmptyState, ChatLayout, MessageBubble, MessageList } from '@/agents/chat';
import type { Suggestion } from '@/agents/chat';
import type { PromptInputBoxHandle } from '@/components/ui/prompt-input-box';
import { PromptInputBox } from '@/components/ui/prompt-input-box';
import { useChatDemo } from '@/agents/chat/demo/useChatDemo';
import { ChatDemoControls } from './ChatDemoControls';

const SUGGESTIONS: Suggestion[] = [
  { label: 'Diagnóstico rápido', action: { kind: 'prefill', text: 'Faça um diagnóstico do meu negócio' } },
  { label: 'Nova proposta', action: { kind: 'prefill', text: 'Quero montar uma proposta para um cliente' } },
  { label: 'Qualificar lead', action: { kind: 'prefill', text: 'Preciso qualificar um lead novo' } },
];

const CALONI_AVATAR_SRC = '/caloni-photo.jpg.jpg';

export default function ChatDemoPure() {
  const inputRef = useRef<PromptInputBoxHandle | null>(null);
  const [composerDisabled, setComposerDisabled] = useState(false);
  const [manualStreaming, setManualStreaming] = useState(false);
  const { messages, isStreaming, send, stop, reset } = useChatDemo();
  const effectiveStreaming = isStreaming || manualStreaming;
  const lastMessageId = messages.at(-1)?.id;

  const handleReset = () => {
    reset();
    inputRef.current?.clear();
    setManualStreaming(false);
  };

  const handleStop = () => {
    if (manualStreaming) {
      setManualStreaming(false);
      return;
    }

    stop();
  };

  return (
    <ChatLayout mode="pure">
      <AgentHeader
        name="Caloni"
        subtitle="Decisor Comercial"
        avatarSrc={CALONI_AVATAR_SRC}
        status={effectiveStreaming ? 'thinking' : 'online'}
        rightSlot={
          <ChatDemoControls
            disabled={composerDisabled}
            manualStreaming={manualStreaming}
            onReset={handleReset}
            onSimulateError={() => send('simular erro', [])}
            onToggleDisabled={() => setComposerDisabled((current) => !current)}
            onToggleManualStreaming={() => setManualStreaming((current) => !current)}
          />
        }
      />

      <MessageList
        messages={messages}
        isStreaming={effectiveStreaming}
        emptyState={
          <ChatEmptyState
            agentName="Caloni"
            agentMission="Converse comigo sobre diagnóstico, proposta ou lead. Posso analisar PDFs e imagens."
            avatarSrc={CALONI_AVATAR_SRC}
            suggestions={SUGGESTIONS}
            onPick={(suggestion) => {
              if (suggestion.action.kind === 'prefill') {
                inputRef.current?.setValue(suggestion.action.text);
                inputRef.current?.focus();
              }
            }}
          />
        }
      >
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            role={message.role}
            variant={message.variant}
            attachments={message.attachments}
            timestamp={message.createdAt}
            isStreaming={effectiveStreaming && message.role === 'assistant' && message.id === lastMessageId}
          >
            {message.content}
          </MessageBubble>
        ))}
      </MessageList>

      <div className="border-t border-border bg-card/60 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-[760px]">
          <PromptInputBox
            ref={inputRef}
            onSend={send}
            onStop={handleStop}
            isLoading={effectiveStreaming}
            disabled={composerDisabled}
            placeholder="Converse com o Caloni..."
          />
        </div>
      </div>
    </ChatLayout>
  );
}
