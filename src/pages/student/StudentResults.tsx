import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { fetchSubmissions } from "@/services/submissionService";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, BarChart } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function StudentResults() {
  const { user } = useAuth();

  // Récupération des soumissions
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['submissions', 'student', user?.id],
    queryFn: () => fetchSubmissions({ studentId: user?.id }),
    enabled: !!user && user.role === 'student',
  });

  // Calcul des statistiques
  const gradedSubmissions = submissions.filter(sub => sub.grade);
  const averageGrade = gradedSubmissions.length > 0
    ? gradedSubmissions.reduce((acc, sub) => acc + (sub.grade || 0), 0) / gradedSubmissions.length
    : 0;
  const bestGrade = gradedSubmissions.length > 0
    ? Math.max(...gradedSubmissions.map(sub => sub.grade || 0))
    : 0;
  const passedExams = gradedSubmissions.filter(sub => (sub.grade || 0) >= 10).length;

  if (isLoading) {
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
          <h1 className="text-3xl font-bold tracking-tight">Mes résultats</h1>
          <p className="text-muted-foreground">
            Consultez vos notes et performances
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Moyenne générale</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageGrade.toFixed(2)}/20</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Meilleure note</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bestGrade.toFixed(2)}/20</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Examens réussis</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{passedExams}/{gradedSubmissions.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Examens en attente</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {submissions.length - gradedSubmissions.length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Détail des résultats</CardTitle>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                Vous n'avez pas encore passé d'examens
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Examen</TableHead>
                    <TableHead>Date de soumission</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">{submission.exam_title}</TableCell>
                      <TableCell>
                        {format(new Date(submission.submitted_at), "Pp", { locale: fr })}
                      </TableCell>
                      <TableCell>
                        {submission.grade ? `${submission.grade}/20` : "En attente"}
                      </TableCell>
                      <TableCell>
                        {submission.grade ? (
                          submission.grade >= 10 ? (
                            <span className="text-green-500">Réussi</span>
                          ) : (
                            <span className="text-red-500">Non réussi</span>
                          )
                        ) : (
                          <span className="text-yellow-500">En attente</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/api/submissions/download/${submission.file_path}`, '_blank')}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 