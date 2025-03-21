import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { fetchExams, downloadExamFile } from "@/services/examService";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Download, Upload, Clock } from "lucide-react";
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
import { useState } from "react";
import ExamSubmissionDialog from "@/components/student/ExamSubmissionDialog";
import { Exam } from "@/types";

export default function StudentExams() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [isSubmissionDialogOpen, setIsSubmissionDialogOpen] = useState(false);

  // Récupération des examens disponibles
  const { data: exams = [], isLoading, refetch } = useQuery({
    queryKey: ['exams', 'available', user?.id],
    queryFn: () => fetchExams({ studentId: user?.id }),
    enabled: !!user && user.role === 'student',
  });

  const handleSubmissionComplete = () => {
    setIsSubmissionDialogOpen(false);
    setSelectedExam(null);
    refetch();
    toast({
      title: "Succès",
      description: "Votre copie a été soumise avec succès",
    });
  };

  const handleSubmit = (exam: Exam) => {
    setSelectedExam(exam);
    setIsSubmissionDialogOpen(true);
  };

  const handleDownload = async (filePath: string) => {
    try {
      window.open(`/api/exams/download/${filePath}`, '_blank');
      toast({
        title: "Téléchargement",
        description: "Le fichier s'ouvre dans un nouvel onglet",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ouvrir le fichier",
        variant: "destructive",
      });
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Examens disponibles</h1>
          <p className="text-muted-foreground">
            Liste des examens à passer
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des examens</CardTitle>
          </CardHeader>
          <CardContent>
            {exams.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                Aucun examen disponible pour le moment
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date limite</TableHead>
                    <TableHead>Professeur</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium">{exam.title}</TableCell>
                      <TableCell>{exam.description || "-"}</TableCell>
                      <TableCell>
                        {exam.deadline ? (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                            {format(new Date(exam.deadline), "Pp", { locale: fr })}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{exam.teacher_name}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(exam.file_path)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleSubmit(exam)}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Soumettre
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

      {selectedExam && (
        <ExamSubmissionDialog
          exam={selectedExam}
          open={isSubmissionDialogOpen}
          onOpenChange={setIsSubmissionDialogOpen}
          onSubmissionComplete={handleSubmissionComplete}
        />
      )}
    </DashboardLayout>
  );
} 