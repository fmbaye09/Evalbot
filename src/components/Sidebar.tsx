import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, BookOpen, PenTool, BarChart2, User, Bot } from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

export function Sidebar() {
  const { user } = useAuth();
  const baseUrl = user?.role === "teacher" ? "/teacher" : "/student";

  // Éléments de navigation en fonction du rôle de l'utilisateur
  const navItems: NavItem[] = user?.role === "teacher" 
    ? [
        { title: "Tableau de bord", href: `${baseUrl}`, icon: <LayoutDashboard className="h-5 w-5" /> },
        { title: "Examens", href: `${baseUrl}/exams`, icon: <BookOpen className="h-5 w-5" /> },
        { title: "Corrections", href: `${baseUrl}/submissions`, icon: <PenTool className="h-5 w-5" /> },
        { title: "Statistiques", href: `${baseUrl}/stats`, icon: <BarChart2 className="h-5 w-5" /> },
        { title: "Assistant IA", href: `${baseUrl}/ai-help`, icon: <Bot className="h-5 w-5" /> }
      ]
    : [
        { title: "Tableau de bord", href: `${baseUrl}`, icon: <LayoutDashboard className="h-5 w-5" /> },
        { title: "Examens", href: `${baseUrl}/exams`, icon: <BookOpen className="h-5 w-5" /> },
        { title: "Mes résultats", href: `${baseUrl}/results`, icon: <BarChart2 className="h-5 w-5" /> },
        { title: "Mon profil", href: `${baseUrl}/profile`, icon: <User className="h-5 w-5" /> },
        { title: "Assistant IA", href: `${baseUrl}/ai-help`, icon: <Bot className="h-5 w-5" /> }
      ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r bg-background h-screen sticky top-0">
      <div className="p-4 border-b flex items-center space-x-2">
        <img src="/img/bot.jpg" alt="Logo" className="h-8 w-auto" />
        <h1 className="text-xl font-bold">Evalbot</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Button
            key={item.href}
            variant="ghost"
            className="w-full justify-start"
            asChild
          >
            <Link
              to={item.href}
              className="flex items-center space-x-3 px-2 py-2 rounded-md hover:bg-accent"
            >
              {item.icon}
              <span>{item.title}</span>
            </Link>
          </Button>
        ))}
      </nav>
      
      <div className="p-4 border-t text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Evalbot</p>
        <p>Tous droits réservés</p>
      </div>
    </aside>
  );
} 