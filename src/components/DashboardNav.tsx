import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FileText, CheckSquare, BarChart2, Search, Bot } from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon?: React.ReactNode;
}

interface DashboardNavProps {
  items: NavItem[];
  className?: string;
}

export function DashboardNav({ items, className }: DashboardNavProps) {
  const { user } = useAuth();
  const baseUrl = user?.role === "teacher" ? "/teacher" : "/student";

  const navItems = user?.role === "teacher" ? [
    { title: "Tableau de bord", href: `${baseUrl}`, icon: <LayoutDashboard className="h-4 w-4 mr-2" /> },
    { title: "Examens", href: `${baseUrl}/exams`, icon: <FileText className="h-4 w-4 mr-2" /> },
    { title: "Corrections", href: `${baseUrl}/submissions`, icon: <CheckSquare className="h-4 w-4 mr-2" /> },
    { title: "Statistiques", href: `${baseUrl}/stats`, icon: <BarChart2 className="h-4 w-4 mr-2" /> },
    { title: "Détection de plagiat", href: `${baseUrl}/plagiarism`, icon: <Search className="h-4 w-4 mr-2" /> },
    { title: "Assistant IA", href: "/chatbot", icon: <Bot className="h-4 w-4 mr-2" /> }
  ] : [
    { title: "Tableau de bord", href: `${baseUrl}`, icon: <LayoutDashboard className="h-4 w-4 mr-2" /> },
    { title: "Examens", href: `${baseUrl}/exams`, icon: <FileText className="h-4 w-4 mr-2" /> },
    { title: "Mes résultats", href: `${baseUrl}/results`, icon: <BarChart2 className="h-4 w-4 mr-2" /> },
    { title: "Assistant IA", href: "/chatbot", icon: <Bot className="h-4 w-4 mr-2" /> }
  ];

  return (
    <nav className={cn("flex space-x-2", className)}>
      {navItems.map((item) => (
        <Button
          key={item.href}
          variant="ghost"
          className="w-full justify-start"
          asChild
        >
          <Link
            to={item.href}
            className="flex items-center space-x-2"
          >
            {item.icon}
            <span>{item.title}</span>
          </Link>
        </Button>
      ))}
    </nav>
  );
} 