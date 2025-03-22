import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DashboardLayout } from "@/components/DashboardLayout";
import { FileText, Users, BarChart, Plus, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchExams } from "@/services/examService";
import { fetchSubmissions } from "@/services/submissionService";
import { Progress } from "@/components/ui/progress";
import ExamCreationDialog from "@/components/teacher/ExamCreationDialog";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Récupération des examens
  const { data: exams = [], isLoading: isLoadingExams } = useQuery({
    queryKey: ['exams', 'teacher', user?.id],
    queryFn: () => fetchExams({ teacherId: user?.id }),
    enabled: !!user && user.role === 'teacher',
  });

  // Récupération des soumissions
  const { data: submissions = [], isLoading: isLoadingSubmissions } = useQuery({
    queryKey: ['submissions', 'teacher', user?.id],
    queryFn: () => fetchSubmissions({ teacherId: user?.id }),
    enabled: !!user && user.role === 'teacher',
  });

  // Calcul des statistiques
  const totalExams = exams.length;
  const pendingSubmissions = submissions.filter(sub => !sub.grade).length;
  const gradedSubmissions = submissions.filter(sub => sub.grade).length;
  const totalSubmissions = submissions.length;
  const averageGrade = gradedSubmissions > 0
    ? submissions.reduce((acc, sub) => acc + (sub.grade || 0), 0) / gradedSubmissions
    : 0;
  const completionRate = totalSubmissions > 0
    ? (gradedSubmissions / totalSubmissions) * 100
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
            Bienvenue, {user?.name || 'Professeur'}
          </p>
        </div>

        {/* Vue d'ensemble rapide */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Examens</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalExams}</div>
              <p className="text-xs text-muted-foreground">
                examens créés
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Copies à corriger</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingSubmissions}</div>
              <p className="text-xs text-muted-foreground">
                en attente de correction
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Moyenne Générale</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
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
              <CardTitle className="text-sm font-medium">Taux de Correction</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
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
              <CardTitle>Gestion des Examens</CardTitle>
              <CardDescription>
                Créez et gérez vos examens
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                className="w-full" 
                onClick={() => navigate("/teacher/exams")}
              >
                <FileText className="mr-2 h-4 w-4" />
                Voir mes examens
              </Button>
              <ExamCreationDialog user={user!} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Corrections en attente</CardTitle>
              <CardDescription>
                {pendingSubmissions} copies nécessitent votre attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                variant="secondary"
                onClick={() => navigate("/teacher/submissions")}
              >
                <Clock className="mr-2 h-4 w-4" />
                Corriger les copies
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistiques détaillées</CardTitle>
              <CardDescription>
                Analysez les performances
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Copies corrigées</span>
                  <span className="font-medium">{gradedSubmissions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Copies en attente</span>
                  <span className="font-medium">{pendingSubmissions}</span>
                </div>
              </div>
              <Button 
                className="w-full mt-4" 
                variant="secondary"
                onClick={() => navigate("/teacher/stats")}
              >
                <BarChart className="mr-2 h-4 w-4" />
                Voir les statistiques
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
} 