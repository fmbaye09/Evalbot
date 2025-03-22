import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

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
    { title: "Tableau de bord", href: `${baseUrl}` },
    { title: "Examens", href: `${baseUrl}/exams` },
    { title: "Corrections", href: `${baseUrl}/submissions` },
    { title: "Statistiques", href: `${baseUrl}/stats` }
  ] : [
    { title: "Tableau de bord", href: `${baseUrl}` },
    { title: "Examens", href: `${baseUrl}/exams` },
    { title: "Mes résultats", href: `${baseUrl}/results` }
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