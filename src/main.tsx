import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { checkOllamaStatus } from './utils/ollamaCheck.ts'
import { Toaster } from './components/ui/toaster.tsx'
import { toast } from './components/ui/use-toast.ts'
import { Bot } from 'lucide-react'

// Vérifier la disponibilité d'Ollama au démarrage
const checkOllamaAvailability = async () => {
  const status = await checkOllamaStatus()
  
  if (!status.ollamaAvailable) {
    setTimeout(() => {
      toast({
        title: "Ollama n'est pas disponible",
        description: "L'assistant IA ne sera pas fonctionnel. Veuillez installer et démarrer Ollama.",
        variant: "destructive",
        duration: 10000,
      })
    }, 1000) // Délai pour permettre à l'application de se charger complètement
  } else if (!status.modelInstalled) {
    setTimeout(() => {
      toast({
        title: "Modèle IA non installé",
        description: "Le modèle deepseek-r1:8b n'est pas installé. L'assistant IA ne sera pas fonctionnel.",
        variant: "destructive",
        duration: 10000,
      })
    }, 1000)
  } else {
    setTimeout(() => {
      toast({
        title: "Assistant IA disponible",
        description: "L'assistant IA est prêt à être utilisé via Ollama et le modèle deepseek-r1:8b.",
        action: (
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
          </div>
        ),
        duration: 2000,
      })
    }, 1000)
  }
}

// Lancer la vérification au démarrage
checkOllamaAvailability()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster />
  </React.StrictMode>,
)
