FROM node:18-alpine

# Création du répertoire de l'application
WORKDIR /app

# Installation des dépendances globales
RUN npm install -g tsx

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances
RUN npm install

# Copie du reste des fichiers de l'application
COPY . .

# Création des dossiers nécessaires pour les uploads
RUN mkdir -p uploads/exams uploads/submissions

# Construction de l'application frontend
RUN npm run build

# Exposition du port utilisé par l'application
EXPOSE 3003

# Commande de démarrage
CMD ["npm", "run", "server"] 