import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileText, Users, BarChart } from "lucide-react";
import { fetchExams } from "@/services/examService";
import { fetchSubmissions } from "@/services/submissionService";
import { User } from "@/types";

interface ExamStatsProps {
  user: User;
}

export default function ExamStats({ user }: ExamStatsProps) {
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

  if (isLoadingExams || isLoadingSubmissions) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calcul des statistiques
  const totalExams = exams.length;
  const pendingSubmissions = submissions.filter(sub => !sub.grade).length;
  const averageGrade = submissions.length > 0
    ? submissions.reduce((acc, sub) => acc + (sub.grade || 0), 0) / submissions.length
    : 0;
  const submittedExams = submissions.length;

  return (
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
          <CardTitle className="text-sm font-medium">Copies à Corriger</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingSubmissions}</div>
          <p className="text-xs text-muted-foreground">
            copies en attente
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
            sur tous les examens
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Copies Soumises</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{submittedExams}</div>
          <p className="text-xs text-muted-foreground">
            copies reçues au total
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 