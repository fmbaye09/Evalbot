
import { useState } from "react";
import { Exam, Submission } from "@/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSubmissions, gradeSubmission, getSubmissionDownloadUrl } from "@/services/submissionService";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import SubmissionCard from "@/components/SubmissionCard";
import { useToast } from "@/components/ui/use-toast";

interface SubmissionsListProps {
  exam: Exam;
  onBack: () => void;
}

const SubmissionsList = ({ exam, onBack }: SubmissionsListProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Récupérer les soumissions pour l'examen sélectionné
  const { 
    data: submissions = [],
    isLoading,
  } = useQuery({
    queryKey: ['submissions', exam.id],
    queryFn: () => fetchSubmissions(exam.id),
  });

  // Mutation pour noter une soumission
  const gradeSubmissionMutation = useMutation({
    mutationFn: async ({ submission, grade }: { submission: Submission, grade: number }) => {
      return gradeSubmission(submission.id, grade);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions', exam.id] });
      
      toast({
        title: "Note ajoutée",
        description: "La note a été attribuée avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la notation",
        variant: "destructive",
      });
    },
  });
  
  const handleDownloadSubmission = async (submission: Submission) => {
    try {
      const url = await getSubmissionDownloadUrl(submission.file_path);
      
      // Créer un lien temporaire pour le téléchargement
      const a = document.createElement('a');
      a.href = url;
      a.download = `submission_${submission.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: "Téléchargement",
        description: `La copie de ${submission.studentName} est en cours de téléchargement`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le fichier",
        variant: "destructive",
      });
    }
  };
  
  const handleGradeSubmission = async (submission: Submission, grade: number) => {
    gradeSubmissionMutation.mutate({ submission, grade });
  };
  
  return (
    <>
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={onBack}
        >
          Retour aux examens
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Chargement des soumissions...</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-lg text-muted-foreground">
            Aucune copie soumise pour cet examen
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {submissions.map((submission) => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              isTeacher={true}
              onDownload={handleDownloadSubmission}
              onGrade={handleGradeSubmission}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default SubmissionsList;
