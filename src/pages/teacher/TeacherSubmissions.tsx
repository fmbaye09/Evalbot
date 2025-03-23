import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { fetchSubmissions } from "@/services/submissionService";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Download, Check, Bot, AlertTriangle } from "lucide-react";
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
import PlagiarismResults from "@/components/teacher/PlagiarismResults";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TeacherSubmissions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [autoGradingId, setAutoGradingId] = useState<string | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

  // Récupération des soumissions
  const { data: submissions = [], isLoading, refetch } = useQuery({
    queryKey: ['submissions', 'teacher', user?.id],
    queryFn: () => fetchSubmissions({ teacherId: user?.id }),
    enabled: !!user && user.role === 'teacher',
  });

  // Regrouper les soumissions par examen
  const submissionsByExam = submissions.reduce((acc: any, submission: any) => {
    const examId = submission.exam_id;
    if (!acc[examId]) {
      acc[examId] = {
        exam: {
          id: examId,
          title: submission.exam_title || 'Examen sans titre',
        },
        submissions: [],
      };
    }
    acc[examId].submissions.push(submission);
    return acc;
  }, {});

  // Fonction pour télécharger une soumission
  const handleDownload = async (filePath: string) => {
    try {
      const { downloadSubmissionFile } = await import('@/services/examService');
      await downloadSubmissionFile(filePath);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de télécharger le fichier",
      });
    }
  };

  // Fonction pour noter automatiquement
  const handleAutoGrade = async (submission: any) => {
    try {
      setAutoGradingId(submission.id);
      const result = await correctionService.autoGradeSubmission(submission.id);
      
      toast({
        title: "Notation automatique terminée",
        description: `Note suggérée: ${result.grade}/20`,
      });
      
      setSelectedSubmission({
        ...submission,
        suggestedGrade: result.grade,
        suggestedFeedback: result.feedback,
      });
    } catch (error) {
      console.error('Erreur lors de la notation auto:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de noter automatiquement cette copie",
      });
    } finally {
      setAutoGradingId(null);
    }
  };

  // Gérer le changement d'examen sélectionné
  const handleExamSelect = (examId: string) => {
    setSelectedExamId(examId);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Soumissions</h1>
          <p className="text-muted-foreground">
            Gérez et notez les copies soumises par vos étudiants.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : Object.keys(submissionsByExam).length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <AlertTriangle className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Aucune soumission disponible pour le moment.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.values(submissionsByExam).map((group: any) => (
              <Card key={group.exam.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>{group.exam.title}</span>
                    <Button
                      variant="outline"
                      onClick={() => handleExamSelect(group.exam.id)}
                    >
                      Voir l'analyse de plagiat
                    </Button>
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  {selectedExamId === group.exam.id ? (
                    <Tabs defaultValue="submissions">
                      <TabsList className="mb-4">
                        <TabsTrigger value="submissions">Soumissions</TabsTrigger>
                        <TabsTrigger value="plagiarism">Analyse de plagiat</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="submissions">
                        <SubmissionsTable 
                          submissions={group.submissions} 
                          handleDownload={handleDownload}
                          handleAutoGrade={handleAutoGrade}
                          autoGradingId={autoGradingId}
                          setSelectedSubmission={setSelectedSubmission}
                        />
                      </TabsContent>
                      
                      <TabsContent value="plagiarism">
                        <PlagiarismResults examId={group.exam.id} />
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <SubmissionsTable 
                      submissions={group.submissions} 
                      handleDownload={handleDownload}
                      handleAutoGrade={handleAutoGrade}
                      autoGradingId={autoGradingId}
                      setSelectedSubmission={setSelectedSubmission}
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedSubmission && (
          <GradingDialog
            submission={selectedSubmission}
            open={!!selectedSubmission}
            onOpenChange={(open) => {
              if (!open) setSelectedSubmission(null);
            }}
            onGraded={() => {
              setSelectedSubmission(null);
              refetch();
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

// Composant de tableau de soumissions extrait pour éviter la duplication de code
function SubmissionsTable({ 
  submissions, 
  handleDownload, 
  handleAutoGrade, 
  autoGradingId, 
  setSelectedSubmission 
}: {
  submissions: any[];
  handleDownload: (filePath: string) => void;
  handleAutoGrade: (submission: any) => void;
  autoGradingId: string | null;
  setSelectedSubmission: (submission: any) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Étudiant</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Note</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      
      <TableBody>
        {submissions.map((submission) => (
          <TableRow key={submission.id}>
            <TableCell className="font-medium">{submission.student_name || 'Étudiant'}</TableCell>
            <TableCell>
              {submission.submitted_at
                ? format(new Date(submission.submitted_at), "dd MMMM yyyy à HH:mm", { locale: fr })
                : 'N/A'}
            </TableCell>
            <TableCell>
              {submission.grade ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                  Noté
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                  En attente
                </span>
              )}
            </TableCell>
            <TableCell>{submission.grade ? `${submission.grade}/20` : '-'}</TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(submission.file_path)}
                >
                  <Download className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSubmission(submission)}
                >
                  <Check className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAutoGrade(submission)}
                  disabled={!!autoGradingId}
                >
                  {autoGradingId === submission.id ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 