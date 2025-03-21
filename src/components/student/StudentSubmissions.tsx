
import { Loader2 } from "lucide-react";
import SubmissionCard from "@/components/SubmissionCard";
import { Submission } from "@/types";
import { getSubmissionDownloadUrl } from "@/services/submissionService";
import { useToast } from "@/components/ui/use-toast";

interface StudentSubmissionsProps {
  submissions: Submission[];
  isLoadingSubmissions: boolean;
}

const StudentSubmissions = ({ submissions, isLoadingSubmissions }: StudentSubmissionsProps) => {
  const { toast } = useToast();
  
  const handleDownloadSubmission = async (submission: Submission) => {
    try {
      const url = await getSubmissionDownloadUrl(submission.file_path);
      
      // Créer un lien temporaire pour le téléchargement
      const a = document.createElement('a');
      a.href = url;
      a.download = `ma_soumission_${submission.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: "Téléchargement",
        description: "Votre copie est en cours de téléchargement",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le fichier",
        variant: "destructive",
      });
    }
  };
  
  if (isLoadingSubmissions) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Chargement des soumissions...</p>
      </div>
    );
  }
  
  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-lg text-muted-foreground">
          Vous n'avez pas encore soumis de copie
        </p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {submissions.map((submission) => (
        <SubmissionCard
          key={submission.id}
          submission={submission}
          isTeacher={false}
          onDownload={handleDownloadSubmission}
        />
      ))}
    </div>
  );
};

export default StudentSubmissions;
