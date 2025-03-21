
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Exam } from "@/types";
import ExamCreationDialog from "@/components/teacher/ExamCreationDialog";
import ExamsList from "@/components/teacher/ExamsList";
import SubmissionsList from "@/components/teacher/SubmissionsList";

const ProfileTeacher = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      navigate("/");
    } else if (user.role !== "teacher") {
      navigate("/student");
    }
  }, [user, loading, navigate]);
  
  const handleViewSubmissions = (exam: Exam) => {
    setSelectedExam(exam);
  };
  
  const handleBackToExams = () => {
    setSelectedExam(null);
  };
  
  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Tableau de bord enseignant</h1>
          <ExamCreationDialog user={user} />
        </div>
        
        <Tabs defaultValue="exams" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="exams">Mes examens</TabsTrigger>
            {selectedExam && (
              <TabsTrigger value="submissions">
                Copies de {selectedExam.title}
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="exams">
            <ExamsList 
              user={user}
              onCreateExam={() => setIsDialogOpen(true)}
              onViewSubmissions={handleViewSubmissions}
            />
          </TabsContent>
          
          {selectedExam && (
            <TabsContent value="submissions">
              <SubmissionsList 
                exam={selectedExam}
                onBack={handleBackToExams}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default ProfileTeacher;
