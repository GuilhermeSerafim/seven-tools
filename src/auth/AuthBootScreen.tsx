import { AppLoader } from "@/components/ui/app-loader";

export function AuthBootScreen() {
  return (
    <AppLoader
      fullscreen
      label="Carregando seu acesso..."
      description="Estamos preparando o hub para voce."
    />
  );
}
