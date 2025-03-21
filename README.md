# Evalbot - Plateforme d'Évaluation et de Détection de Plagiat

Evalbot est une application web complète pour la gestion, la soumission et l'évaluation d'examens, avec des fonctionnalités avancées de détection de plagiat et d'assistance par IA.

## 📋 Sommaire

- [Fonctionnalités](#-fonctionnalités)
- [Architecture](#-architecture)
- [Technologies utilisées](#-technologies-utilisées)
- [Installation et configuration](#-installation-et-configuration)
- [API](#-api)
- [Base de données](#-base-de-données)


## ✨ Fonctionnalités

### Pour les enseignants
- Création et gestion d'examens
- Upload de sujets d'examen au format PDF
- Assistance par IA pour Création de corrigés types
- Assistance par IA pour les corrections
- Détection automatique de plagiat (X)
- Statistiques de performance des étudiants
- Chatbo (X)
- Systeme de notifications en temps réel (X)


### Pour les étudiants
- Consultation des examens disponibles
- Soumission de copies (PDF)
- Suivi des résultats et des feedbacks
- Consultation des notes

### Autres fonctionnalités
- Système d'authentification sécurisé
- Interface utilisateur responsive et moderne


## 🏗 Architecture

Le projet est construit selon une architecture moderne avec:
- **Frontend**: Application React en TypeScript avec Vite
- **Backend**: API REST avec Express.js
- **Base de données**: PostgreSQL
- **IA**:Ollama avec Deepseek


## 🛠 Technologies utilisées

### Frontend
- React 18
- TypeScript
- Vite
- ShadcnUI (composants UI)
- Tailwind CSS


### Backend
- Node.js
- Express.js
- PostgreSQL (avec Knex.js comme query builder)
- JWT pour l'authentification
- Multer pour la gestion des uploads de fichiers

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

