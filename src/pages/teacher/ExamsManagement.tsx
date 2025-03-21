import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { fetchExams, deleteExam, downloadExamFile } from "@/services/examService";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Download, Trash2, Clock, FileText, BookText } from "lucide-react";
import ExamCreationDialog from "@/components/teacher/ExamCreationDialog";
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
import { correctionService } from "@/services/correctionService";

export default function ExamsManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loadingCorrige, setLoadingCorrige] = useState<string | null>(null);

  // Récupération des examens
  const { data: exams = [], isLoading, refetch } = useQuery({
    queryKey: ['exams', 'teacher', user?.id],
    queryFn: () => fetchExams({ teacherId: user?.id }),
    enabled: !!user && user.role === 'teacher',
  });

  // Gestion de la suppression d'un examen
  const handleDeleteExam = async (examId: string) => {
    try {
      await deleteExam(examId);
      refetch();
      toast({
        title: "Succès",
        description: "L'examen a été supprimé avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'examen",
        variant: "destructive",
      });
    }
  };

  // Gestion du téléchargement d'un examen
  const handleDownloadExam = async (filePath: string) => {
    try {
      await downloadExamFile(filePath);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le fichier",
        variant: "destructive",
      });
    }
  };

  // Gestion de la génération du corrigé type
  const handleGenerateCorrige = async (examId: string) => {
    try {
      setLoadingCorrige(examId);
      
      // Vérifier si un corrigé existe déjà
      const exists = await correctionService.checkCorrigeExists(examId);
      
      if (exists) {
        // Demander confirmation avant de régénérer
        if (!confirm("Un corrigé type existe déjà pour cet examen. Voulez-vous le régénérer ?")) {
          setLoadingCorrige(null);
          return;
        }
      }
      
      // Générer le corrigé
      await correctionService.generateCorrigeType(examId);
      
      toast({
        title: "Succès",
        description: "Le corrigé type a été généré avec succès",
      });
    } catch (error) {
      console.error('Erreur lors de la génération du corrigé:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le corrigé type",
        variant: "destructive",
      });
    } finally {
      setLoadingCorrige(null);
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion des Examens</h1>
            <p className="text-muted-foreground">
              Créez et gérez vos examens
            </p>
          </div>
          <ExamCreationDialog user={user!} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des examens</CardTitle>
          </CardHeader>
          <CardContent>
            {exams.length === 0 ? (
              <div className="text-center py-6">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">Aucun examen créé</p>
                <p className="text-sm text-muted-foreground">
                  Commencez par créer votre premier examen
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date limite</TableHead>
                    <TableHead>Créé le</TableHead>
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
                      <TableCell>
                        {format(new Date(exam.created_at), "Pp", { locale: fr })}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDownloadExam(exam.file_path)}
                          title="Télécharger l'examen"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleGenerateCorrige(exam.id)}
                          disabled={loadingCorrige === exam.id}
                          title="Générer corrigé type"
                        >
                          {loadingCorrige === exam.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          ) : (
                            <BookText className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteExam(exam.id)}
                          title="Supprimer l'examen"
                        >
                          <Trash2 className="h-4 w-4" />
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