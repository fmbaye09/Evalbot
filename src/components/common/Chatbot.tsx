import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Send, X, MessageCircle, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { askQuestion, askQuestionStreaming } from '@/services/deepseekService';
import { useToast } from '@/components/ui/use-toast';
import { checkOllamaStatus, getOllamaInstructions } from '@/utils/ollamaCheck';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  error?: boolean;
}

interface ChatbotProps {
  context?: string;
  defaultOpen?: boolean;
}

const Chatbot: React.FC<ChatbotProps> = ({ context, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingOllama, setIsCheckingOllama] = useState(true);
  const [ollamaError, setOllamaError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Référence pour stocker l'identifiant du message IA en cours
  const currentBotMessageId = useRef<string | null>(null);

  // Vérifier la disponibilité d'Ollama au chargement
  const checkOllama = async () => {
    setIsCheckingOllama(true);
    try {
      const status = await checkOllamaStatus();
      if (!status.ollamaAvailable) {
        setOllamaError(status.error || 'Ollama n\'est pas disponible');
        toast({
          variant: 'destructive',
          title: 'Erreur de connexion à Ollama',
          description: status.error || 'Impossible de se connecter à Ollama',
        });
      } else if (!status.modelInstalled) {
        setOllamaError(`Le modèle deepseek-r1:8b n'est pas installé. Exécutez 'ollama pull deepseek-r1:8b' pour l'installer.`);
        toast({
          variant: 'destructive',
          title: 'Modèle non installé',
          description: 'Le modèle deepseek-r1:8b n\'est pas installé',
        });
      } else {
        setOllamaError(null);
        
        // Si nous avions une erreur précédente et qu'elle est maintenant résolue
        if (messages.length === 1 && messages[0].id === 'error') {
          // Remplacer le message d'erreur par le message de bienvenue
          setMessages([{
            id: 'welcome',
            content: "Bonjour ! Je suis votre assistant pour Evalbot, propulsé par le modèle deepseek-r1:8b en local via Ollama. Comment puis-je vous aider aujourd'hui ?",
            isUser: false,
            timestamp: new Date()
          }]);
          
          toast({
            title: "Ollama connecté",
            description: "L'assistant IA est maintenant disponible",
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification d\'Ollama:', error);
      setOllamaError('Une erreur inattendue est survenue lors de la vérification d\'Ollama.');
    } finally {
      setIsCheckingOllama(false);
    }
  };
  
  useEffect(() => {
    checkOllama();
  }, [toast]);

  // Ajouter un message de bienvenue au chargement
  useEffect(() => {
    if (messages.length === 0 && !isCheckingOllama) {
      if (ollamaError) {
        setMessages([
          {
            id: 'error',
            content: `${ollamaError}\n\n${getOllamaInstructions()}`,
            isUser: false,
            timestamp: new Date(),
            error: true
          }
        ]);
      } else {
        setMessages([
          {
            id: 'welcome',
            content: "Bonjour ! Je suis votre assistant pour Evalbot, propulsé par le modèle deepseek-r1:8b en local via Ollama. Comment puis-je vous aider aujourd'hui ?",
            isUser: false,
            timestamp: new Date()
          }
        ]);
      }
    }
  }, [messages.length, ollamaError, isCheckingOllama]);

  // Scroll automatique vers le bas lors de l'ajout de nouveaux messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleToggleChat = () => {
    setIsOpen(!isOpen);
  };

  // Fonction de mise à jour progressive de la réponse
  const updateBotResponse = (partialResponse: string) => {
    setMessages(prev => {
      // Chercher le message de l'IA en cours et le mettre à jour
      if (currentBotMessageId.current) {
        return prev.map(msg => 
          msg.id === currentBotMessageId.current 
            ? { ...msg, content: partialResponse } 
            : msg
        );
      }
      return prev;
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (ollamaError) {
      toast({
        variant: 'destructive',
        title: 'Ollama non disponible',
        description: 'Veuillez installer et démarrer Ollama pour utiliser l\'assistant',
      });
      return;
    }
    
    if (!input.trim()) return;
    
    // Ajouter le message de l'utilisateur
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: input,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Créer d'abord un message vide pour l'IA
      const botMessageId = `bot-${Date.now()}`;
      currentBotMessageId.current = botMessageId;
      
      const botMessage: Message = {
        id: botMessageId,
        content: '', // Commencer avec une réponse vide
        isUser: false,
        timestamp: new Date()
      };
      
      // Ajouter le message vide de l'IA
      setMessages(prev => [...prev, botMessage]);
      
      // Obtenir la réponse en streaming avec mise à jour progressive
      const finalResponse = await askQuestionStreaming(
        input, 
        context,
        updateBotResponse
      );
      
      // Si pour une raison quelconque le streaming échoue, nous avons la réponse finale
      if (!finalResponse || finalResponse.trim() === '') {
        updateBotResponse("Désolé, je n'ai pas pu générer de réponse. Veuillez réessayer.");
      }
    } catch (error) {
      console.error('Erreur lors de la communication avec Ollama:', error);
      
      // Supprimer le message vide en cours s'il existe
      if (currentBotMessageId.current) {
        setMessages(prev => prev.filter(msg => msg.id !== currentBotMessageId.current));
      }
      
      // Ajouter un message d'erreur
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          content: "Une erreur est survenue lors de la communication avec l'IA. Cela peut être dû à une déconnexion d'Ollama. Voulez-vous vérifier à nouveau la connexion?",
          isUser: false,
          timestamp: new Date(),
          error: true
        }
      ]);
      
      // Vérifier si c'est un problème de connexion à Ollama
      if (error instanceof Error && (
          error.message.includes('Failed to fetch') || 
          error.message.includes('connexion') ||
          error.message.includes('connect')
      )) {
        setOllamaError('Connexion à Ollama perdue. Veuillez vérifier qu\'Ollama est en cours d\'exécution.');
      }
      
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de communiquer avec l\'IA. Veuillez vérifier qu\'Ollama est toujours en cours d\'exécution.'
      });
    } finally {
      setIsLoading(false);
      currentBotMessageId.current = null;
    }
  };

  const handleRetryConnection = () => {
    toast({
      title: "Vérification de la connexion",
      description: "Tentative de reconnexion à Ollama...",
    });
    checkOllama();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Bouton pour ouvrir/fermer le chatbot */}
      <Button
        onClick={handleToggleChat}
        className={`rounded-full w-12 h-12 p-0 flex items-center justify-center shadow-lg ${ollamaError ? 'bg-destructive hover:bg-destructive/90' : ''}`}
      >
        {isOpen ? <X size={24} /> : ollamaError ? <AlertTriangle size={24} /> : <MessageCircle size={24} />}
      </Button>
      
      {/* Fenêtre de chat */}
      {isOpen && (
        <Card className="absolute bottom-16 right-0 w-80 md:w-96 shadow-xl transition-all duration-300 ease-in-out">
          <CardHeader className="bg-primary text-primary-foreground pb-2">
            <CardTitle className="text-lg flex justify-between items-center">
              <span>Assistant IA (deepseek-r1:8b)</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary/80"
                onClick={handleToggleChat}
              >
                <X size={18} />
              </Button>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-3 min-h-[300px] max-h-[400px] overflow-y-auto">
            {isCheckingOllama ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
                  <p className="text-muted-foreground">Vérification de la connexion à Ollama...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.isUser ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 ${
                        msg.isUser
                          ? 'bg-primary text-primary-foreground'
                          : msg.error 
                            ? 'bg-destructive/10 border border-destructive text-destructive' 
                            : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <span className="text-xs opacity-70 block mt-1">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      
                      {msg.error && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2 w-full text-xs"
                          onClick={handleRetryConnection}
                        >
                          <RefreshCw className="mr-1 h-3 w-3" />
                          Vérifier la connexion
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && !currentBotMessageId.current && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-lg px-3 py-2 bg-muted">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <p className="text-sm">L'IA réfléchit...</p>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </CardContent>
          
          <CardFooter className="p-3 pt-0">
            <form onSubmit={handleSendMessage} className="flex w-full space-x-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question..."
                className="flex-grow min-h-[40px] max-h-[120px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                disabled={isLoading || isCheckingOllama || ollamaError !== null}
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={isLoading || !input.trim() || isCheckingOllama || ollamaError !== null}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default Chatbot; 