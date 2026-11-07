import {
  Bot,
  Box,
  Brain,
  DollarSign,
  FileCheck,
  FileText,
  Handshake,
  Megaphone,
  ScanSearch,
  Search,
  Settings,
  TrendingUp,
  Zap,
  type LucideIcon,
} from "lucide-react";

const ICON_REGISTRY: Record<string, LucideIcon> = {
  Bot,
  Box,
  Brain,
  DollarSign,
  FileCheck,
  FileText,
  Handshake,
  Megaphone,
  ScanSearch,
  Search,
  Settings,
  TrendingUp,
  Zap,
};

export function getIconByName(name: string): LucideIcon {
  return ICON_REGISTRY[name] ?? Box;
}
