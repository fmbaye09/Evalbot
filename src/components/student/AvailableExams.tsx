import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import ExamCard from "@/components/ExamCard";
import { Exam, Submission, User } from "@/types";
import { fetchExams, getExamDownloadUrl } from "@/services/examService";
import { toast } from "sonner";

interface AvailableExamsProps {
  user: User;
  submissions: Submission[];
  onExamSubmit: (exam: Exam) => void;
}

const AvailableExams = ({ user, submissions, onExamSubmit }: AvailableExamsProps) => {
  const { toast } = useToast();
  
  // Récupérer les examens
  const { 
    data: exams = [], 
    isLoading: isLoadingExams,
    error: examsError
  } = useQuery({
    queryKey: ['exams'],
    queryFn: async () => {
      const data = await fetchExams();
      console.log('Examens reçus:', data);
      return data;
    },
    enabled: !!user && user.role === 'student',
  });
  
  // Vérifie si l'étudiant a déjà soumis une copie pour cet examen
  const isExamSubmitted = (examId: string) => {
    return submissions.some(
      (submission) => submission.exam_id === examId && submission.student_id === user?.id
    );
  };
  
  // Filtre les examens pour ne montrer que ceux auxquels l'étudiant n'a pas encore participé
  const filteredExams = exams.filter(
    (exam) => !isExamSubmitted(exam.id)
  );
  
  console.log('Examens filtrés:', filteredExams);
  
  const handleDownloadExam = async (exam: Exam) => {
    try {
      await getExamDownloadUrl(exam.file_path);
    } catch (error) {
      console.error("Erreur lors du téléchargement de l'examen:", error);
      toast.error("Impossible de télécharger l'examen");
    }
  };
  
  if (isLoadingExams) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Chargement des examens...</p>
      </div>
    );
  }
  
  if (examsError) {
    console.error('Erreur lors du chargement des examens:', examsError);
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-destructive">Erreur lors du chargement des examens</h2>
        <p className="mt-2 text-muted-foreground">Veuillez rafraîchir la page ou réessayer plus tard.</p>
      </div>
    );
  }
  
  if (filteredExams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-lg text-muted-foreground">
          Aucun examen disponible pour le moment
        </p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredExams.map((exam) => (
        <ExamCard
          key={exam.id}
          exam={exam}
          isTeacher={false}
          onDownload={handleDownloadExam}
          onSubmit={onExamSubmit}
        />
      ))}
    </div>
  );
};

export default AvailableExams;
