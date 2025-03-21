import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { fetchExams } from "@/services/examService";
import { fetchSubmissions } from "@/services/submissionService";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, FileText, Users, CheckCircle } from "lucide-react";

export default function TeacherStats() {
  const { user } = useAuth();

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
  const totalSubmissions = submissions.length;
  const gradedSubmissions = submissions.filter(sub => sub.grade).length;
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
          <h1 className="text-3xl font-bold tracking-tight">Statistiques</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble de vos examens et résultats
          </p>
        </div>

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
              <CardTitle className="text-sm font-medium">Total Soumissions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSubmissions}</div>
              <p className="text-xs text-muted-foreground">
                copies reçues
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

        {/* TODO: Ajouter des graphiques détaillés */}
      </div>
    </DashboardLayout>
  );
} 