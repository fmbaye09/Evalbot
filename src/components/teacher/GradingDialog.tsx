import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { gradeSubmission } from "@/services/submissionService";

interface GradingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: {
    id: string;
    exam_title: string;
    student_name: string;
    suggestedGrade?: number;
    suggestedFeedback?: string;
  };
  onGraded?: () => void;
}

export function GradingDialog({ open, onOpenChange, submission, onGraded }: GradingDialogProps) {
  const [grade, setGrade] = useState<string>(submission.suggestedGrade?.toString() || "");
  const [feedback, setFeedback] = useState(submission.suggestedFeedback || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!grade || Number(grade) < 0 || Number(grade) > 20) {
      toast({
        title: "Erreur",
        description: "La note doit être comprise entre 0 et 20",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await gradeSubmission(submission.id, Number(grade), feedback);
      
      // Invalider le cache pour forcer un rechargement des données
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      
      toast({
        title: "Succès",
        description: "La note a été enregistrée avec succès",
      });
      
      if (onGraded) {
        onGraded();
      } else {
        onOpenChange(false);
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la note",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Noter la copie</DialogTitle>
          <DialogDescription>
            {submission.exam_title} - {submission.student_name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="grade" className="text-right">
                Note
              </Label>
              <Input
                id="grade"
                type="number"
                min="0"
                max="20"
                step="0.5"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="col-span-3"
                placeholder="Sur 20"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="feedback" className="text-right">
                Commentaire
              </Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="col-span-3"
                placeholder="Commentaire sur la copie..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 