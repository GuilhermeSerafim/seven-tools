import { SlidersHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatDemoControlsProps {
  disabled: boolean;
  manualStreaming: boolean;
  onReset: () => void;
  onSimulateError: () => void;
  onToggleDisabled: () => void;
  onToggleManualStreaming: () => void;
}

export function ChatDemoControls({
  disabled,
  manualStreaming,
  onReset,
  onSimulateError,
  onToggleDisabled,
  onToggleManualStreaming,
}: ChatDemoControlsProps) {
  return (
    <>
      <div
        data-testid="chat-demo-controls-desktop"
        className="hidden items-center gap-1 md:flex"
      >
        <Button type="button" variant="ghost" size="sm" onClick={onReset}>
          Reset
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onSimulateError}>
          Simular erro
        </Button>
        <Button
          type="button"
          variant={disabled ? 'secondary' : 'ghost'}
          size="sm"
          aria-label="Alternar disabled"
          aria-pressed={disabled}
          onClick={onToggleDisabled}
        >
          disabled
        </Button>
        <Button
          type="button"
          variant={manualStreaming ? 'secondary' : 'ghost'}
          size="sm"
          aria-label="Alternar streaming manual"
          aria-pressed={manualStreaming}
          onClick={onToggleManualStreaming}
        >
          streaming
        </Button>
      </div>

      <div data-testid="chat-demo-controls-mobile" className="flex items-center md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-8 w-8 px-0"
              aria-label="Abrir ajustes"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="sr-only">Ajustes</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Ajustes</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onReset}>Reset</DropdownMenuItem>
            <DropdownMenuItem onClick={onSimulateError}>Simular erro</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={disabled}
              onCheckedChange={() => onToggleDisabled()}
            >
              Composer disabled
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={manualStreaming}
              onCheckedChange={() => onToggleManualStreaming()}
            >
              Streaming manual
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}
