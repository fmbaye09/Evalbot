import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Exam } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { fetchSubmissions } from "@/services/submissionService";
import AvailableExams from "@/components/student/AvailableExams";
import StudentSubmissions from "@/components/student/StudentSubmissions";
import ExamSubmissionDialog from "@/components/student/ExamSubmissionDialog";

const ProfileStudent = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      navigate("/");
    } else if (user.role !== "student") {
      navigate("/teacher");
    }
  }, [user, loading, navigate]);

  // Récupérer les soumissions de l'étudiant
  const { 
    data: submissions = [],
    isLoading: isLoadingSubmissions,
    refetch: refetchSubmissions
  } = useQuery({
    queryKey: ['submissions', 'student'],
    queryFn: () => fetchSubmissions(),
    enabled: !!user && user.role === 'student',
  });
  
  const handleExamSubmit = (exam: Exam) => {
    setSelectedExam(exam);
    setIsDialogOpen(true);
  };

  const handleSubmissionComplete = () => {
    refetchSubmissions();
  };
  
  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-6">Tableau de bord étudiant</h1>
        
        <Tabs defaultValue="exams" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="exams">Examens disponibles</TabsTrigger>
            <TabsTrigger value="submissions">Mes soumissions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="exams">
            <AvailableExams
              user={user}
              submissions={submissions}
              onExamSubmit={handleExamSubmit}
            />
          </TabsContent>
          
          <TabsContent value="submissions">
            <StudentSubmissions
              submissions={submissions}
              isLoadingSubmissions={isLoadingSubmissions}
            />
          </TabsContent>
        </Tabs>
        
        {selectedExam && (
          <ExamSubmissionDialog
            exam={selectedExam}
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            onSubmissionComplete={handleSubmissionComplete}
          />
        )}
      </div>
    </div>
  );
};

export default ProfileStudent;
