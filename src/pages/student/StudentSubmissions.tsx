import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { fetchSubmissions } from "@/services/submissionService";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Eye } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getSubmissionDownloadUrl } from "@/services/submissionService";

export default function StudentSubmissions() {
  const { user } = useAuth();

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["submissions", "student", user?.id],
    queryFn: () => fetchSubmissions({ studentId: user?.id }),
    enabled: !!user && user.role === "student",
  });

  const handleDownload = async (submissionId: string) => {
    const url = await getSubmissionDownloadUrl(submissionId);
    window.open(url, "_blank");
  };

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
          <h1 className="text-3xl font-bold tracking-tight">Mes examens passés</h1>
          <p className="text-muted-foreground">
            Consultez vos examens terminés et leurs résultats
          </p>
        </div>

        <div className="grid gap-4">
          {submissions.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Vous n'avez pas encore passé d'examens.
                </p>
              </CardContent>
            </Card>
          ) : (
            submissions.map((submission) => (
              <Card key={submission.id}>
                <CardHeader>
                  <CardTitle className="text-xl">
                    {submission.exam_title || "Examen sans titre"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Date de soumission</span>
                      <span>
                        {format(new Date(submission.submitted_at), "PPP 'à' p", {
                          locale: fr,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Note</span>
                      <span>
                        {submission.grade !== null
                          ? `${submission.grade}/20`
                          : "En attente de correction"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Commentaire</span>
                      <span>{submission.feedback || "Aucun commentaire"}</span>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(submission.id)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger
                      </Button>
                      {submission.exam && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            window.open(`/student/exams/${submission.exam.id}`, "_blank")
                          }
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir l'examen
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 