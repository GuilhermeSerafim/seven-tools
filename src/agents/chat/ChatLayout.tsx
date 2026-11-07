import {
  Children,
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { PanelRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

type Mode = 'pure' | 'split';

const SPLIT_STORAGE_KEY = 'seven.chat.split-size';
const SPLIT_DEFAULT_SIZES: [number, number] = [60, 40];

const LayoutContext = createContext<Mode>('pure');

export interface ChatLayoutProps {
  mode: Mode;
  children: ReactNode;
  className?: string;
  innerClassName?: string;
}

export function ChatLayout({ mode, children, className, innerClassName }: ChatLayoutProps) {
  if (mode === 'pure') {
    return (
      <LayoutContext.Provider value="pure">
        <div
          className={cn(
            'h-[100dvh] min-h-0 bg-background text-foreground',
            className,
          )}
        >
          <div
            data-layout="pure-inner"
            className={cn(
              'mx-auto grid h-full min-h-0 w-full max-w-[760px] grid-rows-[auto_minmax(0,1fr)_auto]',
              innerClassName,
            )}
          >
            {children}
          </div>
        </div>
      </LayoutContext.Provider>
    );
  }

  // split é adicionado na Task 15
  return (
    <LayoutContext.Provider value="split">
      <SplitLayout className={className}>{children}</SplitLayout>
    </LayoutContext.Provider>
  );
}

function SplitLayout({ children, className }: { children: ReactNode; className?: string }) {
  const isDesktop = useIsDesktop();
  const [sheetOpen, setSheetOpen] = useState(false);

  const panel = findChild(children, 'ChatLayoutPanel');
  const artifact = findChild(children, 'ChatLayoutArtifact');

  if (!isDesktop) {
    return (
      <div className={cn('relative h-[100dvh] bg-background text-foreground', className)}>
        <div data-layout="split-panel" className="h-full">
          {panel}
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button
              size="sm"
              variant="secondary"
              className="absolute right-4 top-[4.25rem] z-20 gap-2 rounded-full border border-border/70 bg-card/95 px-3 shadow-lg backdrop-blur"
              aria-label="Abrir painel de artefato"
            >
              <PanelRight className="h-4 w-4" aria-hidden />
              Preview
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[90vw] max-w-[90vw] sm:max-w-[90vw] p-0"
            aria-describedby={undefined}
          >
            <SheetTitle className="sr-only">Painel de artefato</SheetTitle>
            <div data-layout="split-artifact" className="h-full">
              {artifact}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <div className={cn('h-[100dvh] bg-background text-foreground', className)}>
      <ResizablePanelGroup
        direction="horizontal"
        autoSaveId={SPLIT_STORAGE_KEY}
      >
        <ResizablePanel
          defaultSize={SPLIT_DEFAULT_SIZES[0]}
          minSize={35}
          data-layout="split-panel"
          data-default-size={SPLIT_DEFAULT_SIZES[0]}
        >
          {panel}
        </ResizablePanel>
        <ResizableHandle className="transition-[width] after:w-6" />
        <ResizablePanel
          defaultSize={SPLIT_DEFAULT_SIZES[1]}
          minSize={25}
          data-layout="split-artifact"
          data-default-size={SPLIT_DEFAULT_SIZES[1]}
        >
          {artifact}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : true,
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return isDesktop;
}

function findChild(children: ReactNode, displayName: string): ReactNode {
  const arr = Children.toArray(children) as ReactElement[];
  return arr.find(
    (c) =>
      typeof c === 'object' &&
      c !== null &&
      (c.type as { displayName?: string } | null)?.displayName === displayName,
  );
}

ChatLayout.Panel = function Panel({ children }: { children: ReactNode }) {
  return <>{children}</>;
};
ChatLayout.Panel.displayName = 'ChatLayoutPanel';

ChatLayout.Divider = function Divider() {
  return null;
};
ChatLayout.Divider.displayName = 'ChatLayoutDivider';

ChatLayout.Artifact = function Artifact({ children }: { children: ReactNode }) {
  return <>{children}</>;
};
ChatLayout.Artifact.displayName = 'ChatLayoutArtifact';

export function useChatLayoutMode(): Mode {
  return useContext(LayoutContext);
}
