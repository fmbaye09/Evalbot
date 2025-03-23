import React, { useState, useEffect } from 'react';
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Bot, AlertCircle, Download, RefreshCw } from "lucide-react";
import { askQuestion, askQuestionStreaming } from '@/services/deepseekService';
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { checkOllamaStatus, getOllamaInstructions } from '@/utils/ollamaCheck';
import { Loader2 } from "lucide-react";

export default function AiHelp() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingOllama, setIsCheckingOllama] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ollamaStatus, setOllamaStatus] = useState<{
    ollamaAvailable: boolean;
    modelInstalled: boolean;
    error?: string;
  } | null>(null);
  const { toast } = useToast();

  // Vérifier la disponibilité d'Ollama au chargement
  const checkOllama = async () => {
    setIsCheckingOllama(true);
    setError(null);
    
    try {
      const status = await checkOllamaStatus();
      setOllamaStatus(status);
      
      if (!status.ollamaAvailable || !status.modelInstalled) {
        setError(status.error || 'Ollama ou le modèle deepseek-r1:8b n\'est pas disponible');
      } else {
        toast({
          title: "Ollama connecté",
          description: "L'assistant IA est prêt à l'emploi",
        });
      }
    } catch (err) {
      console.error('Erreur lors de la vérification d\'Ollama:', err);
      setError('Une erreur inattendue est survenue lors de la vérification d\'Ollama.');
    } finally {
      setIsCheckingOllama(false);
    }
  };
  
  useEffect(() => {
    checkOllama();
  }, []);

  const handleRetryConnection = () => {
    toast({
      title: "Vérification de la connexion",
      description: "Tentative de reconnexion à Ollama...",
    });
    checkOllama();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ollamaStatus?.ollamaAvailable || !ollamaStatus?.modelInstalled) {
      toast({
        title: "Ollama non disponible",
        description: "Veuillez installer et démarrer Ollama pour utiliser l'assistant.",
        variant: "destructive",
      });
      return;
    }
    
    if (!question.trim()) {
      toast({
        title: "Question vide",
        description: "Veuillez entrer une question.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Réinitialiser la réponse pour afficher le message de chargement
      setAnswer('');
      
      // Utiliser la version streaming avec une fonction de callback pour les mises à jour
      await askQuestionStreaming(
        question, 
        undefined, 
        (partialResponse) => {
          setAnswer(partialResponse);
        }
      );
    } catch (err) {
      console.error('Erreur lors de la communication avec Ollama:', err);
      
      // Vérifier si c'est un problème de connexion à Ollama
      if (err instanceof Error && (
        err.message.includes('Failed to fetch') || 
        err.message.includes('connexion') ||
        err.message.includes('connect')
      )) {
        setError('Connexion à Ollama perdue. Veuillez vérifier qu\'Ollama est en cours d\'exécution.');
        setOllamaStatus({
          ollamaAvailable: false,
          modelInstalled: false,
          error: err.message
        });
      } else {
        setError('Une erreur est survenue lors de la communication avec l\'IA. Veuillez réessayer.');
      }
      
      toast({
        title: "Erreur",
        description: "Impossible de récupérer une réponse de l'IA.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assistant IA</h1>
          <p className="text-muted-foreground">
            Posez vos questions à notre assistant intelligent propulsé par deepseek-r1:8b via Ollama
          </p>
        </div>

        {isCheckingOllama ? (
          <Alert className="mb-6">
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertTitle>Vérification de la connexion</AlertTitle>
            <AlertDescription>
              Vérification de la disponibilité d'Ollama et du modèle deepseek-r1:8b...
            </AlertDescription>
          </Alert>
        ) : (!ollamaStatus?.ollamaAvailable || !ollamaStatus?.modelInstalled) && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>
              {!ollamaStatus?.ollamaAvailable 
                ? "Ollama n'est pas disponible" 
                : "Modèle deepseek-r1:8b non installé"}
            </AlertTitle>
            <AlertDescription className="mt-4">
              <div className="space-y-4">
                <p>{ollamaStatus?.error || "Une erreur s'est produite lors de la vérification d'Ollama."}</p>
                <div className="bg-muted p-4 rounded-md whitespace-pre-wrap">
                  {getOllamaInstructions()}
                </div>
                <div className="flex flex-wrap gap-4 items-center">
                  <a 
                    href="https://ollama.ai/download" 
                    target="_blank"
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                  >
                    <Download size={16} />
                    Télécharger Ollama
                  </a>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRetryConnection}
                    className="inline-flex items-center gap-2"
                  >
                    <RefreshCw size={16} />
                    Vérifier à nouveau
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Posez votre question</CardTitle>
              <CardDescription>
                Utilisez l'IA DeepSeek locale pour obtenir des réponses à vos questions sur les examens, 
                les corrections, ou pour des explications sur des concepts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Textarea
                  placeholder="Par exemple: Comment puis-je améliorer la détection de plagiat dans mes examens?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={5}
                  className="w-full"
                  disabled={!ollamaStatus?.ollamaAvailable || !ollamaStatus?.modelInstalled || isLoading || isCheckingOllama}
                />
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || !question.trim() || !ollamaStatus?.ollamaAvailable || !ollamaStatus?.modelInstalled || isCheckingOllama}
                >
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Réflexion en cours...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Envoyer
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Réponse de l'IA (deepseek-r1:8b)</CardTitle>
              <CardDescription>
                Notre IA locale vous apporte une réponse basée sur sa compréhension de votre question.
              </CardDescription>
            </CardHeader>
            <CardContent className="min-h-[200px]">
              {error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erreur</AlertTitle>
                  <AlertDescription>
                    <div className="space-y-3">
                      <p>{error}</p>
                      {error.includes('Connexion') && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleRetryConnection}
                          className="inline-flex items-center gap-2"
                        >
                          <RefreshCw size={16} />
                          Vérifier la connexion
                        </Button>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ) : isCheckingOllama ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
                    <p className="text-muted-foreground">Vérification de la connexion à Ollama...</p>
                  </div>
                </div>
              ) : isLoading && !answer ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
                    <p className="text-muted-foreground">L'IA réfléchit à votre question...</p>
                  </div>
                </div>
              ) : answer ? (
                <div className="prose dark:prose-invert max-w-none">
                  <div className="flex items-start space-x-2 mb-4">
                    <Bot className="h-5 w-5 mt-1 text-primary" />
                    <div className="whitespace-pre-wrap text-justify">
                      {answer}
                      {isLoading && (
                        <span className="inline-block ml-1 animate-pulse">▌</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <Bot className="h-12 w-12 mb-4 opacity-50" />
                  <p>Posez une question pour obtenir une réponse de l'IA</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
} 