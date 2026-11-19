import { useTheme } from "@/contexts/ThemeContext";
import { Toaster as Sonner } from "sonner";

const Toaster = () => {
  const { resolvedTheme } = useTheme();

  return <Sonner theme={resolvedTheme === "dark" ? "dark" : "light"} />;
};

export { Toaster };
