import { Search } from 'lucide-react';

interface ToolChatSearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function ToolChatSearchInput({ value, onChange }: ToolChatSearchInputProps) {
  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Buscar conversas"
        placeholder="Buscar conversas"
        className="h-10 w-full rounded-md border border-border/40 bg-background/70 pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}
