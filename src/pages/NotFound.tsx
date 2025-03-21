import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-4">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <h2 className="text-2xl font-semibold">Page non trouvée</h2>
        <p className="text-muted-foreground max-w-md">
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <div className="flex justify-center space-x-4">
          <Button onClick={() => navigate(-1)} variant="outline">
            Retour
          </Button>
          <Button onClick={() => navigate("/")}>
            Accueil
          </Button>
        </div>
      </div>
    </div>
  );
}
