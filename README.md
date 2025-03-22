<<<<<<< HEAD
# Welcome to your Lovable project
=======
# Evalbot - Plateforme Intelligente de gestion d'examens 
>>>>>>> f937e7b2c7653891b83f9c1cda4e3d0c9cc0b75a

## Project info

**URL**: https://lovable.dev/projects/35c29a13-d4dd-488c-8d5c-cf152245ac26

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/35c29a13-d4dd-488c-8d5c-cf152245ac26) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/35c29a13-d4dd-488c-8d5c-cf152245ac26) and click on Share -> Publish.

<<<<<<< HEAD
## I want to use a custom domain - is that possible?
=======
## 🚀 Installation et configuration

### Prérequis
- Node.js (v18+)
- PostgreSQL (v14+)
- npm 
- ollama avec le modèle deepseek-r1:8b
### Étapes d'installation

1. **Cloner le dépôt**
```bash
git clone https://github.com/votre-nom/Evalbot.git
cd Evalbot
```

2. **Installer les dépendances**
```bash
npm install


3. **Configurer les variables d'environnement**
Créez un fichier `.env` basé sur l'exemple fourni:
```env
# Configuration de la base de données
DB_HOST=localhost
DB_PORT=5432
DB_NAME=examinateur_db
DB_USER=votre_utilisateur
DB_PASSWORD=votre_mot_de_passe

# Configuration du serveur
SERVER_PORT=3003

# Configuration de l'API
API_BASE_URL=http://localhost:3003/api

# Configuration JWT
JWT_SECRET=votre_clé_secrète_très_longue_et_complexe_à_changer_en_production

# Autres variables d'environnement
VITE_API_URL=http://localhost:3003/api


```

4. **Créer et initialiser la base de données**
```bash
npm run db:create
npm run db:init

```

5. **Lancer l'application en mode développement**
```bash
npm run dev:server
#


## 🔌 API

L'API REST du projet est organisée en plusieurs routes:

- `/api/auth`: Authentification et gestion des utilisateurs
- `/api/exams`: Gestion des examens
- `/api/correction`: Gestion des corrections
- `/api/notifications`: Système de notifications
- `/api/plagiarism`: Détection de plagiat
- `/api/ai`: Services d'IA pour l'assistance

## 💾 Base de données

Le schéma de la base de données comprend les tables principales suivantes:

- `users`: Informations sur les utilisateurs (enseignants et étudiants)
- `exams`: Examens créés par les enseignants
- `submissions`: Soumissions des étudiants
- `corriges_types`: Corrigés types pour les examens

## MEMBRES DU GROUPE:
- Mouhamed BA
- Mamadou DIALLO
- Mouhamadou Mourtada DIOP
- Babacar Mbaye FAYE
- Ahmad Tidiane KANE

>>>>>>> f937e7b2c7653891b83f9c1cda4e3d0c9cc0b75a

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)
