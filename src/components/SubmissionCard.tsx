
import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Download, Clock, User, Check } from "lucide-react";
import { Submission } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { getSubmissionDownloadUrl } from "@/services/submissionService";
import { useToast } from "@/components/ui/use-toast";

interface SubmissionCardProps {
  submission: Submission;
  isTeacher?: boolean;
  onDownload: (submission: Submission) => void;
  onGrade?: (submission: Submission, grade: number) => void;
}

const SubmissionCard = ({ 
  submission, 
  isTeacher = false, 
  onDownload, 
  onGrade 
}: SubmissionCardProps) => {
  const [grade, setGrade] = useState<number>(submission.grade || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const submittedAtDate = new Date(submission.submitted_at);
  
  const handleGradeSubmit = async () => {
    if (onGrade) {
      setIsSubmitting(true);
      try {
        await onGrade(submission, grade);
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-bold">
            {isTeacher ? submission.studentName : "Votre soumission"}
          </CardTitle>
          <FileText className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-3">
          {!isTeacher && submission.graded && (
            <div className="text-lg font-bold flex items-center justify-center p-3 rounded-md bg-muted">
              Note: <span className="ml-2 text-primary">{submission.grade}/20</span>
            </div>
          )}
          
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-1" />
            <span>Soumis {formatDistanceToNow(submittedAtDate, { addSuffix: true, locale: fr })}</span>
          </div>
          
          {isTeacher && (
            <div className="flex items-center text-sm text-muted-foreground">
              <User className="h-4 w-4 mr-1" />
              <span>{submission.studentName}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        {isTeacher && !submission.graded ? (
          <div className="w-full space-y-2">
            <div className="flex items-center gap-2">
              <label htmlFor="grade" className="text-sm font-medium flex-shrink-0">
                Note sur 20:
              </label>
              <Input
                id="grade"
                type="number"
                min="0"
                max="20"
                step="0.5"
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value))}
                className="w-20"
              />
              <Button 
                size="sm" 
                onClick={handleGradeSubmit}
                disabled={isSubmitting}
                className="ml-auto"
              >
                <Check className="h-4 w-4 mr-1" />
                Confirmer
              </Button>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => onDownload(submission)}
            >
              <Download className="h-4 w-4 mr-1" />
              Télécharger
            </Button>
          </div>
        ) : (
          <div className="w-full">
            {isTeacher && submission.graded && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Note:</span>
                <span className="font-bold text-primary">{submission.grade}/20</span>
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => onDownload(submission)}
            >
              <Download className="h-4 w-4 mr-1" />
              Télécharger
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default SubmissionCard;
