import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DashboardLayout } from "@/components/DashboardLayout";
import { FileText, Clock, BarChart, CheckCircle, AlertCircle, GraduationCap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchExams } from "@/services/examService";
import { fetchSubmissions } from "@/services/submissionService";
import { Progress } from "@/components/ui/progress";

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Récupération des examens disponibles
  const { data: exams = [], isLoading: isLoadingExams } = useQuery({
    queryKey: ['exams', 'available', user?.id],
    queryFn: () => fetchExams({ studentId: user?.id }),
    enabled: !!user && user.role === 'student',
  });

  // Récupération des soumissions de l'étudiant
  const { data: submissions = [], isLoading: isLoadingSubmissions } = useQuery({
    queryKey: ['submissions', 'student', user?.id],
    queryFn: () => fetchSubmissions({ studentId: user?.id }),
    enabled: !!user && user.role === 'student',
  });

  // Calcul des statistiques
  const completedExams = submissions.length;
  const gradedSubmissions = submissions.filter(sub => sub.grade).length;
  const averageGrade = gradedSubmissions > 0
    ? submissions.reduce((acc, sub) => acc + (sub.grade || 0), 0) / gradedSubmissions
    : 0;
  const completionRate = (exams.length + completedExams) > 0 
    ? (completedExams / (exams.length + completedExams)) * 100 
    : 0;

  if (isLoadingExams || isLoadingSubmissions) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Bienvenue, {user?.name || 'Étudiant'}
          </p>
        </div>

        {/* Vue d'ensemble rapide */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Examens à passer</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{exams.length}</div>
              <p className="text-xs text-muted-foreground">
                en attente
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Examens complétés</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedExams}</div>
              <p className="text-xs text-muted-foreground">
                examens terminés
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Moyenne Générale</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageGrade.toFixed(2)}/20</div>
              <p className="text-xs text-muted-foreground">
                sur les examens notés
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progression</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
              <Progress value={completionRate} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Actions principales */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Examens disponibles</CardTitle>
              <CardDescription>
                {exams.length} examens à passer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                onClick={() => navigate("/student/exams")}
              >
                <Clock className="mr-2 h-4 w-4" />
                Voir les examens
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Examens passés</CardTitle>
              <CardDescription>
                Consultez vos examens terminés
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Examens notés</span>
                  <span className="font-medium">{gradedSubmissions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>En attente de note</span>
                  <span className="font-medium">{completedExams - gradedSubmissions}</span>
                </div>
              </div>
              <Button 
                className="w-full mt-4" 
                variant="secondary"
                onClick={() => navigate("/student/submissions")}
              >
                <FileText className="mr-2 h-4 w-4" />
                Voir mes examens passés
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mes résultats</CardTitle>
              <CardDescription>
                Suivez vos performances
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Meilleure note</span>
                  <span className="font-medium">
                    {submissions.length > 0 
                      ? Math.max(...submissions.map(s => s.grade || 0)).toFixed(2)
                      : "N/A"
                    }/20
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Examens réussis</span>
                  <span className="font-medium">
                    {submissions.filter(s => (s.grade || 0) >= 10).length}
                  </span>
                </div>
              </div>
              <Button 
                className="w-full mt-4" 
                variant="secondary"
                onClick={() => navigate("/student/results")}
              >
                <BarChart className="mr-2 h-4 w-4" />
                Voir mes notes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
} 