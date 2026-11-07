import { OrbitalLoader } from "@/components/ui/orbital-loader";
import { cn } from "@/lib/utils";

type AppLoaderSize = "sm" | "md" | "lg";

const sizeClasses: Record<AppLoaderSize, string> = {
  sm: "h-12 w-12",
  md: "h-16 w-16",
  lg: "h-20 w-20",
};

interface AppLoaderProps {
  readonly label: string;
  readonly description?: string;
  readonly size?: AppLoaderSize;
  readonly fullscreen?: boolean;
  readonly className?: string;
}

export function AppLoader({
  label,
  description,
  size = "md",
  fullscreen = false,
  className,
}: AppLoaderProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={cn(
        "flex items-center justify-center px-4 text-foreground",
        fullscreen ? "min-h-screen bg-background" : "py-10",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div
          data-testid="app-loader-orbital"
          className="flex items-center justify-center text-primary"
        >
          <OrbitalLoader className={sizeClasses[size]} />
        </div>

        <div className="space-y-1">
          <p className="font-medium text-foreground">{label}</p>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
