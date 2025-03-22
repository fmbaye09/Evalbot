import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { fetchSubmissions } from "@/services/submissionService";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Download, Check, Bot } from "lucide-react";
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
import { GradingDialog } from "@/components/teacher/GradingDialog";
import { correctionService } from "@/services/correctionService";

export default function TeacherSubmissions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [autoGradingId, setAutoGradingId] = useState<string | null>(null);

  // Récupération des soumissions
  const { data: submissions = [], isLoading, refetch } = useQuery({
    queryKey: ['submissions', 'teacher', user?.id],
    queryFn: () => fetchSubmissions({ teacherId: user?.id }),
    enabled: !!user && user.role === 'teacher',
  });

  // Filtrer les soumissions non notées
  const pendingSubmissions = submissions.filter(sub => !sub.grade);

  const handleDownload = async (filePath: string) => {
    try {
      window.open(`/api/submissions/download/${filePath}`, '_blank');
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le fichier",
        variant: "destructive",
      });
    }
  };

  // Gestion de la correction automatique
  const handleAutoGrade = async (submission: any) => {
    try {
      setAutoGradingId(submission.id);
      
      // Vérifier si un corrigé existe pour cet examen
      const corrigeExists = await correctionService.checkCorrigeExists(submission.exam_id);
      
      if (!corrigeExists) {
        toast({
          title: "Corrigé type manquant",
          description: "Vous devez d'abord générer un corrigé type pour cet examen.",
          variant: "destructive",
        });
        return;
      }
      
      // Corriger automatiquement la soumission
      const result = await correctionService.autoGradeSubmission(submission.id);
      
      if (result.success) {
        toast({
          title: "Correction automatique réussie",
          description: `Note proposée : ${result.grade}/20`,
        });
        
        // Mettre à jour la liste des soumissions
        refetch();
      } else {
        throw new Error(result.message || "Erreur de correction");
      }
    } catch (error) {
      console.error('Erreur lors de la correction automatique:', error);
      toast({
        title: "Erreur",
        description: "Impossible de corriger automatiquement cette soumission",
        variant: "destructive",
      });
    } finally {
      setAutoGradingId(null);
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
          <h1 className="text-3xl font-bold tracking-tight">Corrections en attente</h1>
          <p className="text-muted-foreground">
            {pendingSubmissions.length} copies nécessitent votre attention
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des soumissions</CardTitle>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                Aucune soumission à corriger
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Étudiant</TableHead>
                    <TableHead>Examen</TableHead>
                    <TableHead>Date de soumission</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>{submission.student_name}</TableCell>
                      <TableCell>{submission.exam_title}</TableCell>
                      <TableCell>
                        {format(new Date(submission.submitted_at), "Pp", { locale: fr })}
                      </TableCell>
                      <TableCell>
                        {submission.grade ? (
                          <span className="text-green-500">Corrigé</span>
                        ) : (
                          <span className="text-yellow-500">En attente</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {submission.grade ? `${submission.grade}/20` : "-"}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(submission.file_path)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger
                        </Button>
                        {!submission.grade && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAutoGrade(submission)}
                              disabled={autoGradingId === submission.id}
                            >
                              {autoGradingId === submission.id ? (
                                <>
                                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                  Correction...
                                </>
                              ) : (
                                <>
                                  <Bot className="h-4 w-4 mr-2" />
                                  Corriger auto
                                </>
                              )}
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => setSelectedSubmission(submission)}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Noter
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedSubmission && (
        <GradingDialog
          isOpen={!!selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          submission={selectedSubmission}
        />
      )}
    </DashboardLayout>
  );
} 