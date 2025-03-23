#!/bin/bash

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Déploiement de l'application Examinateur AI ===${NC}"

# Vérification de Docker
if ! command -v docker &> /dev/null || ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker ou Docker Compose n'est pas installé. Veuillez l'installer avant de continuer.${NC}"
    exit 1
fi

# Création d'un fichier .env à partir de l'exemple s'il n'existe pas
if [ ! -f .env ]; then
    echo -e "${YELLOW}Fichier .env non trouvé. Création à partir de .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}Fichier .env créé. Veuillez vérifier et modifier les valeurs si nécessaire.${NC}"
    else
        echo -e "${RED}Fichier .env.example non trouvé. Veuillez créer un fichier .env manuellement.${NC}"
        exit 1
    fi
fi

# Création des dossiers nécessaires
echo -e "${YELLOW}Création des dossiers pour les uploads...${NC}"
mkdir -p uploads/exams uploads/submissions
echo -e "${GREEN}Dossiers créés.${NC}"

# Construction et démarrage des conteneurs
echo -e "${YELLOW}Construction et démarrage des conteneurs Docker...${NC}"
docker-compose up -d --build

# Vérification du statut des conteneurs
sleep 5
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}=== Déploiement réussi ! ===${NC}"
    echo -e "${GREEN}L'application est accessible aux adresses suivantes :${NC}"
    echo -e "${GREEN}- API: http://localhost:5000${NC}"
    echo -e "${GREEN}- Frontend: http://localhost:3000 (en mode développement)${NC}"
    echo
    echo -e "${YELLOW}Pour arrêter l'application :${NC} docker-compose down"
    echo -e "${YELLOW}Pour voir les logs :${NC} docker-compose logs -f"
else
    echo -e "${RED}=== Erreur lors du déploiement. Vérifiez les logs : docker-compose logs -f ===${NC}"
fi 