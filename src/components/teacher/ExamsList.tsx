
import { useState } from "react";
import { Exam, User } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { fetchExams, getExamDownloadUrl } from "@/services/examService";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import ExamCard from "@/components/ExamCard";
import { useToast } from "@/components/ui/use-toast";

interface ExamsListProps {
  user: User;
  onCreateExam: () => void;
  onViewSubmissions: (exam: Exam) => void;
}

const ExamsList = ({ user, onCreateExam, onViewSubmissions }: ExamsListProps) => {
  const { toast } = useToast();
  
  // Récupérer les examens
  const { 
    data: exams = [], 
    isLoading,
    error
  } = useQuery({
    queryKey: ['exams'],
    queryFn: fetchExams,
    enabled: !!user && user.role === 'teacher',
  });
  
  const handleDownloadExam = async (exam: Exam) => {
    try {
      const url = await getExamDownloadUrl(exam.file_path);
      
      // Créer un lien temporaire pour le téléchargement
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exam.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: "Téléchargement",
        description: `Le fichier "${exam.title}" est en cours de téléchargement`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le fichier",
        variant: "destructive",
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Chargement des examens...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-destructive">Erreur lors du chargement des examens</h2>
        <p className="mt-2 text-muted-foreground">Veuillez rafraîchir la page ou réessayer plus tard.</p>
      </div>
    );
  }
  
  if (exams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-lg text-muted-foreground">
          Vous n'avez pas encore créé d'examen
        </p>
        <Button className="mt-4" onClick={onCreateExam}>
          <Plus className="h-4 w-4 mr-2" />
          Créer un examen
        </Button>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {exams.map((exam) => (
        <ExamCard
          key={exam.id}
          exam={exam}
          isTeacher={true}
          onDownload={handleDownloadExam}
          onViewSubmissions={onViewSubmissions}
        />
      ))}
    </div>
  );
};

export default ExamsList;
