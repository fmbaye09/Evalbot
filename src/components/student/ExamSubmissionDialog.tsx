import { useState } from "react";
import { Exam } from "@/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { examService } from "@/services/examService";
import { toast } from "sonner";

interface ExamSubmissionDialogProps {
  exam: Exam;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmissionComplete: () => void;
}

const ExamSubmissionDialog = ({ exam, open, onOpenChange, onSubmissionComplete }: ExamSubmissionDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error("Le fichier ne doit pas dépasser 10MB");
        return;
      }
      if (!selectedFile.type.match(/^image\/(jpeg|png|gif)$/) && selectedFile.type !== "application/pdf") {
        toast.error("Le fichier doit être une image (JPEG, PNG, GIF) ou un PDF");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Veuillez sélectionner un fichier");
      return;
    }

    console.log("Tentative de soumission pour l'examen:", {
      examId: exam.id,
      fileType: file.type,
      fileSize: file.size,
      fileName: file.name
    });

    try {
      setIsSubmitting(true);
      const response = await examService.submitExam(exam.id, file);
      console.log("Réponse de la soumission:", response);
      
      if (response && response.id) {
        toast.success("Votre copie a été soumise avec succès");
        onSubmissionComplete();
        onOpenChange(false);
      } else {
        console.error("Réponse invalide de la soumission:", response);
        toast.error("Erreur lors de la soumission de votre copie");
      }
    } catch (error) {
      console.error("Erreur détaillée lors de la soumission:", error);
      toast.error(error instanceof Error ? error.message : "Impossible de soumettre votre copie");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Soumettre votre copie</DialogTitle>
          <DialogDescription>
            Pour l'examen : {exam.title}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="file">Fichier de votre copie</Label>
            <Input
              id="file"
              type="file"
              accept="image/jpeg,image/png,image/gif,application/pdf"
              onChange={handleFileChange}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!file || isSubmitting}
          >
            {isSubmitting ? "Soumission en cours..." : "Soumettre"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExamSubmissionDialog; 