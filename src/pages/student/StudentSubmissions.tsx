import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { fetchSubmissions } from "@/services/submissionService";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Download, Info, Bot } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";

export default function StudentSubmissions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [feedbackDialog, setFeedbackDialog] = useState<{
    isOpen: boolean;
    feedback: string;
  }>({
    isOpen: false,
    feedback: "",
  });

  // Récupération des soumissions
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['submissions', 'student', user?.id],
    queryFn: () => fetchSubmissions({ studentId: user?.id }),
    enabled: !!user && user.role === 'student',
  });

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

  const openFeedback = (feedback: string) => {
    setFeedbackDialog({
      isOpen: true,
      feedback: feedback || "Aucun commentaire disponible pour cette soumission.",
    });
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
          <h1 className="text-3xl font-bold tracking-tight">Mes soumissions</h1>
          <p className="text-muted-foreground">
            Consultez vos rendus et leurs évaluations
          </p>
          <div className="mt-2 text-sm text-muted-foreground flex items-center">
            <Bot className="h-4 w-4 mr-2" />
            Les soumissions peuvent être corrigées automatiquement
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des soumissions</CardTitle>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                Vous n'avez encore soumis aucun examen
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
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
                      <TableCell>{submission.exam_title}</TableCell>
                      <TableCell>
                        {format(new Date(submission.submitted_at), "Pp", { locale: fr })}
                      </TableCell>
                      <TableCell>
                        {submission.grade ? (
                          <div className="flex items-center">
                            <span className="text-green-500 mr-2">Corrigé</span>
                            {submission.auto_graded && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                                      <Bot className="h-3 w-3 mr-1" />
                                      Auto
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Corrigé automatiquement</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
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
                        {submission.feedback && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openFeedback(submission.feedback)}
                          >
                            <Info className="h-4 w-4 mr-2" />
                            Feedback
                          </Button>
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

      <Dialog
        open={feedbackDialog.isOpen}
        onOpenChange={(isOpen) =>
          setFeedbackDialog((prev) => ({ ...prev, isOpen }))
        }
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Feedback de l'enseignant</DialogTitle>
            <DialogDescription>
              Voici les commentaires de l'enseignant sur votre travail
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 whitespace-pre-wrap">
            {feedbackDialog.feedback}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
} 