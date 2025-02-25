# Gestion-Exam
Sujet de Projet : Plateforme Web de Gestion d'Examens avec 
Correction Automatique par IA et Fonctionnalités Avancées
Equipes : 5 personnes max
Contexte et Objectifs
L'objectif de ce projet est de développer une plateforme web complète permettant 
aux enseignants de déposer des sujets d'examen et aux étudiants de soumettre leurs 
réponses sous forme de fichiers PDF. La plateforme intégrera une version locale de 
DeepSeek (via Ollama) pour fournir une correction automatique des copies, une 
évaluation des performances des étudiants, ainsi que des fonctionnalités avancées 
telles que la détection de plagiat, un chatbot d'assistance et des statistiques 
détaillées. Cette solution vise à simplifier le processus de gestion des examens tout 
en offrant une évaluation rapide, objective et enrichie.
Fonctionnalités Requises
1. Gestion des Utilisateurs :
o Deux types d'utilisateurs : Enseignants et Étudiants.
o Les enseignants peuvent :
§ Créer et déposer des sujets d'examen (format PDF ou texte).
§ Consulter les copies soumises par les étudiants.
§ Visualiser les corrections automatiques et les notes.
§ Modifier ou valider les notes proposées par l'IA.
§ Accéder à des statistiques détaillées (moyennes, distribution des 
notes, etc.).
o Les étudiants peuvent :
§ Accéder aux sujets d'examen.
§ Soumettre leurs réponses en PDF.
§ Consulter leurs notes après correction.
§ Interagir avec un chatbot pour poser des questions sur les sujets 
ou les corrections.
2. Interface Web :
o Une interface intuitive pour le dépôt des sujets et des copies.
o Un tableau de bord pour les enseignants et les étudiants.
o Un système de notifications pour informer les étudiants de la 
disponibilité des sujets et des résultats.
3. Intégration avec DeepSeek (via Ollama) :
o Utilisation d'un modèle local de DeepSeek pour :
§ Analyser le sujet d'examen et générer un corrigé type.
§ Comparer les copies des étudiants avec le corrigé type.
§ Attribuer une note sur 20 en fonction de la similarité et de la 
qualité des réponses.
o Possibilité pour l'enseignant de modifier ou valider les notes proposées 
par l'IA.
4. Détection de Plagiat :
o Comparaison des copies entre elles pour détecter les similitudes.
o Génération d'un rapport de plagiat pour chaque copie soumise.
o Alertes automatiques pour les enseignants en cas de suspicion de 
plagiat.
5. Chatbot d'Assistance :
o Intégration d'un chatbot pour répondre aux questions des étudiants sur 
les sujets d'examen ou les corrections.
o Utilisation de DeepSeek pour fournir des réponses précises et 
contextuelles.
6. Statistiques et Rapports :
o Génération automatique de statistiques pour les enseignants :
§ Moyennes des notes.
§ Distribution des notes (histogrammes).
§ Taux de réussite.
o Rapports détaillés sur les performances des étudiants.
7. Base de Données :
o Stockage des sujets d'examen, des copies d'étudiants, des corrigés et 
des notes.
o Gestion des comptes utilisateurs (enseignants et étudiants).
8. Sécurité :
o Authentification sécurisée (par exemple, via JWT).
o Protection des données sensibles (sujets, copies, notes).
9. Déploiement :
o La plateforme doit être déployée sur un serveur accessible aux 
utilisateurs (par exemple, via Docker).
o Documentation claire pour l'installation et l'utilisation.
Technologies Recommandées
• Frontend : React.js, Angular ou Vue.js pour l'interface utilisateur.
• Backend : Node.js (Express), Django ou Flask pour la logique métier.
• Base de Données : PostgreSQL ou MySQL pour le stockage des données.
• IA : Intégration de DeepSeek via Ollama (API ou modèle local).
• Détection de Plagiat : Utilisation de bibliothèques comme Turnitin ou 
développement d'un algorithme de comparaison de textes.
• Chatbot : Intégration de DeepSeek pour les réponses contextuelles.
• Déploiement : Docker, Nginx, et un service cloud (AWS, Azure, ou Heroku).
Livrables Attendus
1. Une application web fonctionnelle avec toutes les fonctionnalités décrites.
2. Un rapport détaillé expliquant :
o L'architecture du système.
o Les choix technologiques.
o Les défis rencontrés et les solutions apportées.
o Les améliorations possibles.
3. Une démonstration de la plateforme avec des exemples concrets (sujets, 
copies, corrections, détection de plagiat, interaction avec le chatbot, etc.).
Évaluation
Les étudiants seront évalués sur :
• La qualité et la fonctionnalité de la plateforme.
• L'intégration réussie de l'IA pour la correction automatique et le chatbot.
• La mise en œuvre de la détection de plagiat.
• La génération de statistiques et rapports.
• La clarté du code et de la documentation.
• La présentation et la démonstration du projet.
Améliorations Possibles
• Ajout d'un système de gestion des groupes (classes) pour les enseignants.
• Intégration d'un système de messagerie interne entre enseignants et étudiants.
• Génération automatique de certificats de réussite pour les étudiants
