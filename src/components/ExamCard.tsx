import { useState } from "react";
import { Exam } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Eye, Trash2, Upload } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import ExamSubmissionDialog from "./student/ExamSubmissionDialog";

interface ExamCardProps {
  exam: Exam;
  isTeacher: boolean;
  onDownload?: (exam: Exam) => void;
  onViewSubmissions?: (exam: Exam) => void;
  onDelete?: (exam: Exam) => void;
  onSubmit?: (exam: Exam) => void;
}

const ExamCard = ({ exam, isTeacher, onDownload, onViewSubmissions, onDelete, onSubmit }: ExamCardProps) => {
  const [isSubmissionDialogOpen, setIsSubmissionDialogOpen] = useState(false);

  const handleSubmit = () => {
    setIsSubmissionDialogOpen(true);
  };

  const handleSubmissionComplete = () => {
    onSubmit?.(exam);
  };

  return (
    <>
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="line-clamp-1">{exam.title}</CardTitle>
          <CardDescription>
            Créé le {format(new Date(exam.created_at), "d MMMM yyyy", { locale: fr })}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex-grow">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {exam.description}
          </p>
          {exam.deadline && (
            <p className="text-sm text-muted-foreground mt-2">
              Date limite : {format(new Date(exam.deadline), "d MMMM yyyy à HH:mm", { locale: fr })}
            </p>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-end gap-2">
          {onDownload && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownload(exam)}
            >
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
          )}
          
          {!isTeacher && onSubmit && (
            <Button
              variant="default"
              size="sm"
              onClick={handleSubmit}
            >
              <Upload className="h-4 w-4 mr-2" />
              Soumettre
            </Button>
          )}
          
          {isTeacher && onViewSubmissions && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewSubmissions(exam)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Voir les copies
            </Button>
          )}
          
          {isTeacher && onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(exam)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          )}
        </CardFooter>
      </Card>

      {!isTeacher && onSubmit && (
        <ExamSubmissionDialog
          exam={exam}
          open={isSubmissionDialogOpen}
          onOpenChange={setIsSubmissionDialogOpen}
          onSubmissionComplete={handleSubmissionComplete}
        />
      )}
    </>
  );
};

export default ExamCard;
