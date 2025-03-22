import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { DashboardNav } from "@/components/DashboardNav";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const navItems = user?.role === "teacher"
    ? [
        { title: "Tableau de bord", href: "/" },
        { title: "Examens", href: "/exams" },
        { title: "Résultats", href: "/results" },
        { title: "Profil", href: "/profile" },
      ]
    : [
        { title: "Tableau de bord", href: "/" },
        { title: "Mes examens", href: "/exams" },
        { title: "Mes résultats", href: "/results" },
        { title: "Mon profil", href: "/profile" },
      ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <DashboardNav items={navItems} />
          
          <div className="flex items-center space-x-2">
            <img src="/img/bot.jpg" alt="logo" className="h-8 w-auto object-contain" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </Button>
            <Button variant="outline" onClick={logout}>
              Se déconnecter
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6">
        {children}
      </main>

      <footer className="border-t">
        <div className="container py-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Evalbot. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
} 