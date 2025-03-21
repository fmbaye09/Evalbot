import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate(user.role === "teacher" ? "/teacher" : "/student");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement en cours...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Evalbot</CardTitle>
            <CardDescription className="text-lg mt-2">
              Plateforme d'examens assistée par l'intelligence artificielle
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <img src="/img/logo.png" alt="logo" />
              <p className="text-muted-foreground">
                Bienvenue !
              </p>
              <p className="text-muted-foreground">
                Connectez-vous ou inscrivez-vous pour commencer.
              </p>
            </div>
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 justify-center">
              <Button 
                onClick={() => navigate("/login")}
                size="lg"
                className="flex-1 sm:flex-initial"
              >
                Se connecter
              </Button>
              <Button 
                onClick={() => navigate("/register")}
                variant="outline"
                size="lg"
                className="flex-1 sm:flex-initial"
              >
                S'inscrire
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
