# Examinateur AI

Une application moderne de gestion d'examens avec détection de plagiat et assistant IA intégré.

![Bannière Examinateur AI](https://via.placeholder.com/1200x300/0073e6/ffffff?text=Examinateur+AI)

## 📋 Table des matières

- [Fonctionnalités principales](#-fonctionnalités-principales)
- [Captures d'écran](#-captures-décran)
- [Technologies utilisées](#-technologies-utilisées)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Utilisation](#-utilisation)
- [Architecture](#-architecture)
- [API Reference](#-api-reference)
- [Dépannage](#-dépannage)
- [Contribution](#-contribution)

## 🚀 Fonctionnalités principales

- **Gestion des examens** : Création, modification et suppression d'examens pour les enseignants
- **Soumission de travaux** : Interface intuitive pour les étudiants
- **Détection de plagiat** : Système automatisé d'analyse des similitudes entre les soumissions
- **Assistant IA local** : Aide contextuelle alimentée par le modèle deepseek-r1:8b via Ollama
- **Correction automatique** : Évaluation assistée par IA des copies d'étudiants

## 📸 Captures d'écran

<div align="center">
  <img src="https://via.placeholder.com/400x250/e6f7ff/333333?text=Dashboard+Enseignant" alt="Dashboard Enseignant" width="400"/>
  <img src="https://via.placeholder.com/400x250/e6f7ff/333333?text=Détection+de+Plagiat" alt="Détection de Plagiat" width="400"/>
  <img src="https://via.placeholder.com/400x250/e6f7ff/333333?text=Assistant+IA" alt="Assistant IA" width="400"/>
  <img src="https://via.placeholder.com/400x250/e6f7ff/333333?text=Soumission+Étudiant" alt="Soumission Étudiant" width="400"/>
</div>

## 💻 Technologies utilisées

### Frontend
- **React** avec TypeScript
- **TailwindCSS** et **shadcn/ui** pour l'interface
- **React Query** pour la gestion d'état et requêtes API
- **Vite** comme outil de build

### Backend
- **Node.js** et **Express** 
- **PostgreSQL** pour la base de données
- **Multer** pour la gestion des téléchargements de fichiers
- **JSON Web Tokens** pour l'authentification

### IA et Analyse
- **Ollama** avec le modèle **deepseek-r1:8b**
- **pdf.js-extract** pour l'extraction de texte des PDFs
- Algorithme propriétaire de détection de plagiat

## 🔧 Installation

### Prérequis

- Node.js 18+
- PostgreSQL
- Ollama (pour l'assistant IA)

### Étapes d'installation

1. Cloner le dépôt
   ```bash
   git clone https://github.com/votre-organisation/examinateur-ai.git
   cd examinateur-ai
   ```

2. Installer les dépendances
   ```bash
   npm install
   ```

3. Configurer l'environnement
   ```bash
   cp .env.example .env
   # Modifier le fichier .env avec vos paramètres
   ```

4. Initialiser la base de données
   ```bash
   npm run db:reset
   npm run db:add-plagiarism
   ```

5. Installer Ollama et le modèle deepseek-r1:8b (pour l'assistant IA)
   ```bash
   # Installer Ollama depuis https://ollama.ai/download
   ollama pull deepseek-r1:8b
   ```

6. Démarrer l'application en mode développement
   ```bash
   npm run dev:server
   ```

## ⚙️ Configuration

### Variables d'environnement

Créez un fichier `.env` à la racine du projet avec les paramètres suivants :

```env
# Configuration de la base de données
DB_HOST=localhost
DB_PORT=5432
DB_NAME=examinateur_db
DB_USER=votre_utilisateur
DB_PASSWORD=votre_mot_de_passe

# Clé secrète pour JWT
JWT_SECRET=votre_cle_secrete_ici

# Configuration d'Ollama (serveur local)
VITE_OLLAMA_API_URL=http://localhost:11434
```

### Structure des dossiers

L'application crée automatiquement les dossiers suivants pour le stockage des fichiers :

- `uploads/` - Dossier racine pour tous les fichiers
- `uploads/exams/` - Sujets d'examens
- `uploads/submissions/` - Copies soumises par les étudiants

## 🖥️ Utilisation

### Accès à l'application

- **Mode développement** : Accédez à l'application via `http://localhost:3000`
- L'API est disponible sur `http://localhost:5000`

### Rôles utilisateur

L'application prend en charge deux types d'utilisateurs :

1. **Enseignants** - Peuvent créer des examens, gérer les soumissions, détecter le plagiat
2. **Étudiants** - Peuvent consulter les examens disponibles et soumettre leurs travaux

### Workflow typique

#### Pour les enseignants :

1. Créer un compte avec le rôle "enseignant"
2. Créer un nouvel examen avec sujet au format PDF
3. Attendre les soumissions des étudiants
4. Corriger manuellement ou utiliser la correction automatique
5. Lancer l'analyse de plagiat si nécessaire
6. Consulter les statistiques et résultats

#### Pour les étudiants :

1. Créer un compte avec le rôle "étudiant"
2. Consulter les examens disponibles
3. Télécharger le sujet d'examen
4. Soumettre leur travail avant la date limite
5. Consulter leurs notes et feedback

## 🏗️ Architecture

### Structure de la base de données

Le schéma de base de données comprend les tables principales suivantes :

- `users` - Informations sur les utilisateurs
- `exams` - Détails des examens créés
- `submissions` - Soumissions des étudiants
- `corriges_types` - Corrigés types pour les examens
- `plagiarism_results` - Résultats de détection de plagiat

### Détection de plagiat

L'algorithme de détection de plagiat fonctionne en plusieurs étapes :

1. Extraction du texte des PDF soumis
2. Normalisation du texte (minuscules, suppression de la ponctuation)
3. Découpage en n-grammes (groupes de mots)
4. Calcul du coefficient de Jaccard pour mesurer la similarité
5. Identification des passages similaires

La formule utilisée est :
```
similarité = (taille de l'intersection / taille de l'union) * 100
```

### Assistant IA

L'assistant utilise Ollama pour:

- Générer des corrigés types à partir des sujets d'examen
- Évaluer les copies d'étudiants et suggérer des notes
- Répondre aux questions des utilisateurs en mode conversationnel

## 📚 API Reference

### Routes d'authentification

```
POST /api/auth/register     - Inscription
POST /api/auth/login        - Connexion
GET  /api/auth/me           - Profil utilisateur
```

### Routes d'examen

```
GET    /api/exams           - Liste des examens
POST   /api/exams           - Créer un examen
GET    /api/exams/:id       - Détails d'un examen
PUT    /api/exams/:id       - Modifier un examen
DELETE /api/exams/:id       - Supprimer un examen
```

### Routes de soumission

```
GET  /api/exams/:examId/submissions   - Liste des soumissions
POST /api/exams/:examId/submissions   - Créer une soumission
```

### Routes de correction

```
POST /api/correction/generate-corrige/:examId   - Générer un corrigé type
POST /api/correction/auto-grade/:submissionId   - Correction automatique
```

### Routes de plagiat

```
POST   /api/plagiarism/analyze/:examId    - Analyser le plagiat
GET    /api/plagiarism/results/:examId    - Résultats de plagiat
DELETE /api/plagiarism/results/:examId    - Supprimer les résultats
```

## 🔍 Dépannage

### Problèmes courants

#### Erreur de connexion à Ollama

**Symptôme**: Message "Impossible de se connecter au serveur Ollama local"

**Solutions**:
1. Vérifiez qu'Ollama est installé et en cours d'exécution
2. Vérifiez que le port 11434 est accessible
3. Assurez-vous que le modèle deepseek-r1:8b est installé avec `ollama list`

#### Erreur de base de données

**Symptôme**: Messages d'erreur lors de la connexion à PostgreSQL

**Solutions**:
1. Vérifiez que PostgreSQL est en cours d'exécution
2. Vérifiez les paramètres dans le fichier `.env`
3. Recréez la base de données avec `npm run db:reset`

#### Erreur de téléchargement de fichier

**Symptôme**: Les fichiers ne sont pas correctement sauvegardés

**Solutions**:
1. Vérifiez que le dossier `uploads` existe et est accessible en écriture
2. Vérifiez les limitations de taille de fichier (5MB pour examens, 10MB pour soumissions)

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Forkez le projet
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Committez vos changements (`git commit -am 'Ajout d'une nouvelle fonctionnalité'`)
4. Poussez vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👏 Remerciements

- Équipe de développement d'Ollama
- Créateurs du modèle deepseek-r1:8b
- Communauté shadcn/ui pour les composants d'interface

---

© 2023 Examinateur AI | Développé avec ❤️ 