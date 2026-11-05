import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const Icon = isDark ? Moon : Sun;
  const label = `Switch to ${isDark ? "light" : "dark"} mode`;
  const toggle = () => setTheme(isDark ? "light" : "dark");

  return compact ? (
    <button type="button" title={label} aria-label={label} onClick={toggle}
      className="inline-flex items-center justify-center rounded-sm hover:text-sidebar-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
      <Icon size={18} />
    </button>
  ) : (
    <Button variant="outline" size="icon" type="button" title={label} aria-label={label} onClick={toggle}>
      <Icon size={20} />
    </Button>
  );
}
