import { useState } from "react";
import { User } from "@/types";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import FileUpload from "@/components/FileUpload";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createExam } from "@/services/examService";

interface ExamCreationDialogProps {
  user: User;
}

const ExamCreationDialog = ({ user }: ExamCreationDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [examFile, setExamFile] = useState<File | null>(null);
  const [examTitle, setExamTitle] = useState("");
  const [examDescription, setExamDescription] = useState("");
  const [examDeadline, setExamDeadline] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  
  // Mutation pour créer un examen
  const createExamMutation = useMutation({
    mutationFn: async () => {
      if (!examFile || !examTitle.trim() || !user) {
        throw new Error("Informations manquantes");
      }
      
      return createExam(
        {
          title: examTitle,
          description: examDescription,
          deadline: examDeadline || undefined,
        },
        examFile
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      setExamTitle("");
      setExamDescription("");
      setExamDeadline("");
      setExamFile(null);
      setIsOpen(false);
      
      toast({
        title: "Examen créé",
        description: "L'examen a été créé avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    },
  });

  const handleExamCreation = () => {
    if (!examFile || !examTitle.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }
    
    createExamMutation.mutate();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel examen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Créer un nouvel examen</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Titre*
            </Label>
            <Input
              id="title"
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              value={examDescription}
              onChange={(e) => setExamDescription(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="deadline" className="text-right">
              Date limite
            </Label>
            <Input
              id="deadline"
              type="datetime-local"
              value={examDeadline}
              onChange={(e) => setExamDeadline(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-right pt-2">
              <Label>Fichier PDF*</Label>
            </div>
            <div className="col-span-3">
              <FileUpload
                onFileSelected={setExamFile}
                label=""
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button 
            type="submit" 
            onClick={handleExamCreation}
            disabled={createExamMutation.isPending}
          >
            {createExamMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Création en cours...
              </>
            ) : (
              "Créer l'examen"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExamCreationDialog;
