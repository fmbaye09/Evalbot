import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { PlagiarismResult, getPlagiarismResults, analyzePlagiarism } from "@/services/plagiarismService";
import { Loader2 } from "lucide-react";

interface PlagiarismResultsProps {
  examId: string;
}

const PlagiarismResults: React.FC<PlagiarismResultsProps> = ({ examId }) => {
  const [results, setResults] = useState<PlagiarismResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<PlagiarismResult | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  // Charger les résultats au chargement du composant
  useEffect(() => {
    loadResults();
  }, [examId]);

  // Fonction pour charger les résultats
  const loadResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPlagiarismResults(examId);
      setResults(data);
    } catch (err) {
      setError('Erreur lors du chargement des résultats');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour lancer l'analyse de plagiat
  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      setError(null);
      
      await analyzePlagiarism(examId);
      
      toast({
        title: 'Analyse terminée',
        description: 'L\'analyse de plagiat a été effectuée avec succès.',
      });
      
      // Recharger les résultats après l'analyse
      await loadResults();
    } catch (err) {
      setError('Erreur lors de l\'analyse de plagiat');
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: err.message || 'Une erreur est survenue lors de l\'analyse.',
      });
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  // Fonction pour afficher les détails d'un résultat
  const handleViewDetails = (result: PlagiarismResult) => {
    setSelectedResult(result);
    setDialogOpen(true);
  };

  // Obtenir un badge de couleur basé sur le score de similarité
  const getSimilarityBadge = (score: number) => {
    // Convertir explicitement le score en nombre
    const numericScore = Number(score);
    
    if (numericScore >= 75) {
      return <Badge variant="destructive">{numericScore.toFixed(1)}%</Badge>;
    } else if (numericScore >= 50) {
      return <Badge variant="default" className="bg-orange-500">{numericScore.toFixed(1)}%</Badge>;
    } else if (numericScore >= 25) {
      return <Badge variant="outline" className="text-yellow-500 border-yellow-500">{numericScore.toFixed(1)}%</Badge>;
    } else {
      return <Badge variant="outline">{numericScore.toFixed(1)}%</Badge>;
    }
  };

  // Obtenir une liste de passages similaires à partir du champ JSON
  const getSimilarPassages = (passagesJson?: string): string[] => {
    if (!passagesJson) return [];
    try {
      return JSON.parse(passagesJson);
    } catch (e) {
      console.error('Erreur lors du parsing des passages:', e);
      return [];
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Détection de Plagiat</h2>
        <Button 
          onClick={handleAnalyze} 
          disabled={analyzing}
        >
          {analyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyse en cours...
            </>
          ) : (
            <>
              Lancer l'analyse
            </>
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : results.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Aucun résultat de plagiat disponible. Lancez une analyse pour détecter le plagiat entre les copies.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Résultats de plagiat</CardTitle>
            <CardDescription>
              {results.length} comparaisons effectuées
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Étudiant 1</TableHead>
                  <TableHead>Étudiant 2</TableHead>
                  <TableHead>Similarité</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell>{result.student1_name || 'Étudiant 1'}</TableCell>
                    <TableCell>{result.student2_name || 'Étudiant 2'}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getSimilarityBadge(result.similarity_score)}
                        <Progress value={Number(result.similarity_score)} className="w-24" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewDetails(result)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Détails
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dialog pour afficher les détails */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du plagiat</DialogTitle>
            <DialogDescription>
              Comparaison entre {selectedResult?.student1_name} et {selectedResult?.student2_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Taux de similarité:</span>
              <div className="flex items-center space-x-2">
                {selectedResult && getSimilarityBadge(selectedResult.similarity_score)}
                <Progress 
                  value={selectedResult?.similarity_score ? Number(selectedResult.similarity_score) : 0} 
                  className="w-32"
                />
              </div>
            </div>
            
            {selectedResult && selectedResult.similar_passages && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Passages similaires détectés:</h3>
                <div className="bg-muted p-3 rounded-md max-h-56 overflow-y-auto">
                  <ul className="list-disc pl-5 space-y-2">
                    {getSimilarPassages(selectedResult.similar_passages).map((passage, index) => (
                      <li key={index} className="text-sm">
                        <span className="italic">{passage}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlagiarismResults; 