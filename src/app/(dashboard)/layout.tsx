import AppShell from "@/components/layout/app-shell";
import { ThemeProvider } from "@/components/providers/theme-provider";

export default function AppScopedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AppShell>{children}</AppShell>
    </ThemeProvider>
  );
}
