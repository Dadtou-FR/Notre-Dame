# 🎓 Système de Gestion d'École

Une application web complète pour la gestion d'établissements scolaires, développée avec Node.js, Express et MySQL.

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Technologies utilisées](#-technologies-utilisées)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Structure du projet](#-structure-du-projet)
- [API Documentation](#-api-documentation)
- [Utilisation](#-utilisation)
- [Déploiement](#-déploiement)
- [Contribution](#-contribution)
- [Support](#-support)

## ✨ Fonctionnalités

### 👥 Gestion des Étudiants
- ✅ Inscription et gestion des profils étudiants
- ✅ Génération automatique de matricules
- ✅ Suivi des informations personnelles et familiales
- ✅ Attribution aux classes
- ✅ Gestion des statuts (actif, inactif, diplômé)
- ✅ Recherche et filtrage avancés

### 👨‍🏫 Gestion des Enseignants
- ✅ Profils enseignants complets
- ✅ Gestion des spécialités
- ✅ Attribution des cours aux classes
- ✅ Suivi des salaires (optionnel)

### 🏫 Gestion des Classes
- ✅ Création et organisation des classes
- ✅ Définition des capacités
- ✅ Fixation des frais de scolarité par classe

### 📝 Évaluations et Notes
- ✅ Création d'examens (devoirs, compositions, examens blancs)
- ✅ Saisie des notes avec coefficients
- ✅ Calcul automatique des moyennes
- ✅ Génération de bulletins

### 💰 Gestion Financière
- ✅ Enregistrement des paiements
- ✅ Suivi des frais de scolarité
- ✅ Génération de reçus
- ✅ Alertes pour paiements en retard
- ✅ Rapports financiers détaillés

### 📊 Statistiques et Rapports
- ✅ Tableaux de bord interactifs
- ✅ Graphiques et visualisations
- ✅ Statistiques d'effectifs
- ✅ Analyses des résultats scolaires
- ✅ Rapports financiers
- ✅ Export des données (CSV, Excel, PDF)

### 🔧 Fonctionnalités Techniques
- ✅ Interface responsive et moderne
- ✅ API RESTful complète
- ✅ Recherche et filtrage en temps réel
- ✅ Pagination automatique
- ✅ Validation des données
- ✅ Système de notifications
- ✅ Cache intelligent
- ✅ Sauvegarde automatique des formulaires

## 🛠 Technologies utilisées

### Backend
- **Node.js** - Environnement d'exécution JavaScript
- **Express.js** - Framework web minimaliste
- **MongoDB** - Base de données NoSQL
- **Mongoose** - ODM pour MongoDB
- **JWT** - Authentification par tokens
- **bcryptjs** - Hachage des mots de passe
- **express-validator** - Validation des données
- **multer** - Gestion des uploads de fichiers
- **socket.io** - Communication en temps réel
- **puppeteer** - Génération de PDF (bulletins, certificats)

### Frontend
- **EJS** - Moteur de templates
- **Bootstrap 5** - Framework CSS
- **jQuery** - Bibliothèque JavaScript
- **Chart.js** - Graphiques et visualisations
- **DataTables** - Tableaux interactifs
- **Font Awesome** - Icônes

### Outils de développement
- **nodemon** - Rechargement automatique
- **dotenv** - Gestion des variables d'environnement
- **jest** - Tests unitaires

## 🚀 Installation

### Prérequis
- Node.js (version 14 ou supérieure)
- MySQL (version 5.7 ou supérieure)
- npm ou yarn

### Étapes d'installation

1. **Cloner le repository**
```bash
git clone https://github.com/votre-username/gestion-ecole.git
cd gestion-ecole
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer la base de données**
```bash
# Créer la base de données MySQL
mysql -u root -p
CREATE DATABASE gestion_ecole CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

4. **Configurer les variables d'environnement**
```bash
cp .env.example .env
# Éditer le fichier .env avec vos paramètres
```

5. **Initialiser la base de données**
```bash
npm run init-db
```

6. **Démarrer l'application**
```bash
# Mode développement
npm run dev

# Mode production
npm start
```

L'application sera accessible à l'adresse : `http://localhost:5000`

## ⚙️ Configuration

### Variables d'environnement (.env)

```env
# Serveur
NODE_ENV=development
PORT=3000

# Base de données
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=gestion_ecole

# Sécurité
JWT_SECRET=votre_jwt_secret_tres_securise
SESSION_SECRET=votre_session_secret_tres_securise

# Configuration école
SCHOOL_NAME=Nom de votre école
SCHOOL_ADDRESS=Adresse de l'école
SCHOOL_PHONE=+261 20 XX XX XX XX
SCHOOL_EMAIL=contact@votre-ecole.mg

# Paramètres par défaut
DEFAULT_SCHOOL_YEAR=2024-2025
DEFAULT_REGISTRATION_FEE=50000
DEFAULT_SCHOOL_FEE=300000
```

### Configuration de la base de données

L'application créera automatiquement les tables nécessaires au premier démarrage. Les tables principales incluent :

- `etudiants` - Informations des étudiants
- `enseignants` - Profils des enseignants
- `classes` - Organisation des classes
- `cours` - Matières enseignées
- `examens` - Évaluations
- `resultats` - Notes des étudiants
- `paiements` - Transactions financières

## 📁 Structure du projet

```
gestionecole/
├── backend/                 # Code backend (API, logique métier)
│   ├── index.js            # Point d'entrée du serveur
│   ├── package.json        # Dépendances backend
│   ├── routes/             # Routes Express
│   ├── models/             # Modèles MongoDB
│   ├── middleware/         # Middlewares personnalisés
│   ├── config/             # Configuration (DB, etc.)
│   ├── scripts/            # Scripts utilitaires
│   ├── TODO.md             # TODO list for backend tasks
│   └── ...
├── frontend/                # Code frontend (templates, assets)
│   ├── views/              # Templates EJS
│   ├── assets/             # CSS, JS, images
│   └── ...
├── package.json            # Scripts de gestion du projet
├── README.md               # Documentation
└── .env                    # Variables d'environnement
```

## 📡 API Documentation

### Authentification
La plupart des endpoints nécessitent une authentification. Utilisez le token JWT dans l'en-tête :
```
Authorization: Bearer <votre_token>
```

### Endpoints principaux

#### Étudiants
- `GET /api/etudiants` - Liste des étudiants
- `GET /api/etudiants/:id` - Détails d'un étudiant
- `POST /api/etudiants` - Créer un étudiant
- `PUT /api/etudiants/:id` - Modifier un étudiant
- `DELETE /api/etudiants/:id` - Supprimer un étudiant
- `GET /api/etudiants/stats/global` - Statistiques globales

#### Enseignants
- `GET /api/enseignants` - Liste des enseignants
- `GET /api/enseignants/:id` - Détails d'un enseignant
- `POST /api/enseignants` - Créer un enseignant
- `PUT /api/enseignants/:id` - Modifier un enseignant
- `DELETE /api/enseignants/:id` - Supprimer un enseignant

#### Classes
- `GET /api/classes` - Liste des classes
- `GET /api/classes/:id` - Détails d'une classe
- `POST /api/classes` - Créer une classe
- `PUT /api/classes/:id` - Modifier une classe
- `DELETE /api/classes/:id` - Supprimer une classe

#### Paiements
- `GET /api/paiements` - Liste des paiements
- `GET /api/paiements/:id` - Détails d'un paiement
- `POST /api/paiements` - Enregistrer un paiement
- `PUT /api/paiements/:id` - Modifier un paiement
- `GET /api/paiements/stats/global` - Statistiques financières
- `GET /api/paiements/retards/list` - Paiements en retard

#### AJAX
- `GET /ajax/fetch_etudiants` - Étudiants avec filtres
- `GET /ajax/fetch_enseignants` - Enseignants avec filtres
- `GET /ajax/fetch_filtre` - Options de filtrage
- `GET /ajax/fetch_bulletin/:id` - Bulletin d'un étudiant

### Exemples de requêtes

#### Créer un étudiant
```javascript
POST /api/etudiants
Content-Type: application/json

{
  "nom": "Doe",
  "prenom": "John",
  "date_naissance": "2005-06-15",
  "sexe": "M",
  "classe_id": 1,
  "nom_parent": "Jane Doe",
  "telephone_parent": "+261 34 XX XX XX XX"
}
```

#### Enregistrer un paiement
```javascript
POST /api/paiements
Content-Type: application/json

{
  "etudiant_id": 1,
  "montant": 250000,
  "type_paiement": "frais_scolarite",
  "date_paiement": "2024-01-15",
  "mode_paiement": "especes"
}
```

## 🎯 Utilisation

### Tableau de bord
- Vue d'ensemble des statistiques principales
- Graphiques de répartition des étudiants
- Alertes et notifications importantes
- Actions rapides

### Gestion des étudiants
1. Cliquer sur "Étudiants" dans le menu
2. Utiliser les filtres pour rechercher
3. Cliquer sur "Ajouter" pour inscrire un nouvel étudiant
4. Remplir le formulaire avec les informations requises
5. Sauvegarder pour générer automatiquement le matricule

### Enregistrement des paiements
1. Aller dans "Paiements"
2. Cliquer sur "Nouveau paiement"
3. Sélectionner l'étudiant concerné
4. Saisir le montant et le type de paiement
5. Choisir le mode de paiement
6. Enregistrer pour générer automatiquement la référence

### Génération de bulletins
1. Aller dans "Bulletins"
2. Sélectionner l'étudiant et la période
3. Le système calcule automatiquement les moyennes
4. Exporter en PDF ou imprimer

### Consultation des statistiques
- Tableaux de bord avec graphiques interactifs
- Rapports d'effectifs par classe
- Analyses financières
- Export des données en Excel/CSV

## 🚀 Déploiement

### Déploiement sur serveur Linux

1. **Préparer le serveur**
```bash
# Installer Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installer MySQL
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

2. **Configurer l'application**
```bash
# Cloner le projet
git clone https://github.com/votre-username/gestion-ecole.git
cd gestion-ecole

# Installer les dépendances
npm install --production

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec les paramètres de production
```

3. **Configurer le serveur web (Nginx)**
```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

4. **Configurer PM2 pour la gestion des processus**
```bash
# Installer PM2
sudo npm install -g pm2

# Démarrer l'application
pm2 start index.js --name "gestion-ecole"

# Configurer le démarrage automatique
pm2 startup
pm2 save
```

### Déploiement avec Docker

1. **Créer le Dockerfile**
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000
CMD ["npm", "start"]
```

2. **Créer docker-compose.yml**
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - db
    volumes:
      - ./uploads:/app/uploads

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: gestion_ecole
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

3. **Lancer avec Docker Compose**
```bash
docker-compose up -d
```

## 🧪 Tests

### Tests unitaires
```bash
# Exécuter tous les tests
npm test

# Tests avec couverture
npm run test:coverage

# Tests en mode watch
npm run test:watch
```

### Tests d'intégration
```bash
# Tests API
npm run test:api

# Tests E2E
npm run test:e2e
```

## 🔧 Maintenance

### Sauvegarde de la base de données
```bash
# Sauvegarde complète
mysqldump -u root -p gestion_ecole > backup_$(date +%Y%m%d).sql

# Sauvegarde automatique (cron)
# Ajouter dans crontab -e :
0 2 * * * /usr/bin/mysqldump -u root -p[password] gestion_ecole > /backups/gestion_ecole_$(date +\%Y\%m\%d).sql
```

### Mise à jour de l'application
```bash
# Sauvegarder la base de données
mysqldump -u root -p gestion_ecole > backup_avant_maj.sql

# Mettre à jour le code
git pull origin main
npm install

# Redémarrer l'application
pm2 restart gestion-ecole
```

### Monitoring et logs
```bash
# Voir les logs PM2
pm2 logs gestion-ecole

# Monitoring en temps réel
pm2 monit

# Status des processus
pm2 status
```

## 🛡️ Sécurité

### Bonnes pratiques implémentées
- ✅ Validation et sanitisation des données d'entrée
- ✅ Protection contre les injections SQL (requêtes préparées)
- ✅ Hachage sécurisé des mots de passe
- ✅ Authentification par JWT
- ✅ Limitation des tentatives de connexion
- ✅ Protection CORS
- ✅ Validation des fichiers uploadés

### Recommandations supplémentaires
- Utiliser HTTPS en production
- Configurer un firewall (UFW, iptables)
- Mettre à jour régulièrement les dépendances
- Auditer le code avec `npm audit`
- Sauvegarder régulièrement la base de données

## 📈 Performance

### Optimisations implémentées
- ✅ Pagination automatique des listes
- ✅ Cache en mémoire pour les données fréquentes
- ✅ Compression gzip
- ✅ Optimisation des requêtes SQL
- ✅ Lazy loading des images
- ✅ Minification des assets CSS/JS

### Monitoring des performances
```bash
# Analyser les performances
npm run analyze

# Profiling de l'application
node --inspect index.js
```

## 🤝 Contribution

Nous accueillons les contributions ! Voici comment procéder :

### Processus de contribution
1. **Fork** le repository
2. **Créer** une branche pour votre fonctionnalité (`git checkout -b feature/nouvelle-fonctionnalite`)
3. **Commiter** vos changements (`git commit -am 'Ajouter nouvelle fonctionnalité'`)
4. **Pousser** vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. **Créer** une Pull Request

### Standards de code
- Utiliser ESLint pour la cohérence du code
- Écrire des tests pour les nouvelles fonctionnalités
- Documenter les nouvelles API
- Suivre les conventions de nommage existantes

### Signalement de bugs
Utilisez les [Issues GitHub](https://github.com/votre-username/gestion-ecole/issues) en incluant :
- Description détaillée du problème
- Étapes pour reproduire
- Environnement (OS, version Node.js, navigateur)
- Captures d'écran si pertinentes

## 📚 Documentation supplémentaire

### Guides spécialisés
- [Guide d'installation détaillé](docs/installation.md)
- [Configuration avancée](docs/configuration.md)
- [Guide API complet](docs/api.md)
- [Personnalisation de l'interface](docs/customization.md)
- [Gestion des utilisateurs](docs/users.md)

### Tutoriels
- [Première configuration](docs/tutorials/first-setup.md)
- [Importer des données existantes](docs/tutorials/data-import.md)
- [Personnaliser les rapports](docs/tutorials/custom-reports.md)

## 🌍 Internationalisation

L'application supporte actuellement :
- 🇫🇷 Français (par défaut)
- 🇬🇧 Anglais (à venir)
- 🇪🇸 Espagnol (à venir)

Pour ajouter une nouvelle langue :
```bash
# Copier le fichier de langue
cp locales/fr.json locales/[code_langue].json

# Traduire les chaînes
# Configurer dans .env
DEFAULT_LANGUAGE=[code_langue]
```

## 💡 FAQ

### Questions fréquentes

**Q : Comment changer le logo de l'école ?**
R : Remplacez le fichier `assets/images/logo.png` et redémarrez l'application.

**Q : Peut-on gérer plusieurs années scolaires ?**
R : Oui, l'application supporte la gestion multi-années avec archivage automatique.

**Q : Comment importer des données depuis Excel ?**
R : Utilisez la fonctionnalité d'import dans le menu "Outils" → "Importer des données".

**Q : L'application fonctionne-t-elle hors ligne ?**
R : Partiellement. Certaines fonctionnalités de consultation fonctionnent hors ligne grâce au cache.

**Q : Comment personnaliser les bulletins ?**
R : Modifiez les templates dans `views/bulletins/templates/` et les styles associés.

## 🎓 Contexte éducatif

Cette application a été conçue spécifiquement pour les écoles de Madagascar et de la région de l'Océan Indien, avec :

### Adaptations locales
- Devise en Ariary (Ar) par défaut
- Calendrier scolaire malgache
- Niveaux scolaires standards
- Support des numéros de téléphone locaux
- Gestion des noms malgaches

### Conformité réglementaire
- Respect des normes du Ministère de l'Éducation
- Formats de bulletins officiels
- Statistiques conformes aux rapports requis

## 📞 Support

### Support technique
- 📧 Email : support@gestion-ecole.mg
- 💬 Chat : [Discord](https://discord.gg/votre-serveur)
- 📱 WhatsApp : +261 34 XX XX XX XX
- 🐛 Bugs : [Issues GitHub](https://github.com/votre-username/gestion-ecole/issues)

### Documentation
- 📖 Wiki : [GitHub Wiki](https://github.com/votre-username/gestion-ecole/wiki)
- 🎥 Tutoriels vidéo : [YouTube](https://youtube.com/votre-chaine)
- 📋 Changelog : [CHANGELOG.md](CHANGELOG.md)

### Communauté
- 👥 Forum : [Discussions GitHub](https://github.com/votre-username/gestion-ecole/discussions)
- 📱 Telegram : [Groupe Telegram](https://t.me/votre-groupe)

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

```
MIT License

🎓 Présentation de l’Application : Gestion École
1. Contexte et justification du projet
Dans de nombreux établissements scolaires, la gestion administrative est encore réalisée de manière manuelle ou à l’aide d’outils non centralisés (fichiers papier, tableurs isolés, etc.). Cette méthode peut entraîner :
•	Des pertes d’informations
•	Des erreurs de saisie
•	Un manque de suivi efficace
•	Une difficulté d’accès rapide aux données
C’est dans ce contexte qu’a été développée l’application Gestion École, une solution numérique visant à moderniser et centraliser l’administration scolaire.
2. Objectif général
L’objectif principal de l’application est de faciliter la gestion administrative d’un établissement scolaire à travers une plateforme informatique simple, sécurisée et efficace.

3. Objectifs spécifiques
L’application permet notamment :
•	La gestion des élèves (ajout, modification, suppression, consultation)
•	La gestion des enseignants
•	L’organisation des classes
•	Le suivi des inscriptions
•	La gestion des paiements scolaires
•	La consultation et le suivi des informations administratives
Elle permet ainsi d’améliorer l’organisation interne et d’optimiser le temps de travail du personnel administratif.
4. Description technique
L’application Gestion École a été développée en utilisant les technologies suivantes :
•	JavaScript (logique de programmation)
•	(Ajouter ici : Node.js pour le backend si tu l’utilises)
•	(Ajouter ici : MySQL ou MongoDB pour la base de données)
•	(Ajouter ici : HTML / CSS pour l’interface utilisateur)
Le système repose sur une architecture permettant :
•	L’enregistrement des données dans une base de données sécurisée
•	L’affichage dynamique des informations
•	La gestion des opérations CRUD (Créer, Lire, Modifier, Supprimer)
5. Apports du projet
Ce projet présente plusieurs avantages :
•	✅ Centralisation des informations scolaires
•	✅ Réduction des erreurs administratives
•	✅ Gain de temps dans la gestion quotidienne
•	✅ Meilleure organisation des données
•	✅ Base évolutive pouvant intégrer d’autres fonctionnalités
6. Perspectives d’amélioration
Dans les versions futures, l’application pourrait intégrer :
•	Un système d’authentification sécurisé par rôles (administrateur, enseignant, comptable)
•	Un module de gestion des notes et bulletins
•	Une interface mobile
•	Une sauvegarde automatique des données
•	Des statistiques avancées et tableaux de bord

7. Licence
L’application est distribuée sous licence MIT, permettant son utilisation, sa modification et sa distribution libre, sous réserve du respect des conditions de la licence.

🎤 Version courte pour présentation orale (soutenance)
Si tu dois présenter à l’oral :
L’application Gestion École est une solution numérique développée pour moderniser la gestion administrative des établissements scolaires.
Elle permet de gérer les élèves, les enseignants, les classes et les paiements de manière centralisée.
Ce projet vise à réduire les erreurs administratives, améliorer l’organisation et faciliter l’accès aux informations.
Il a été développé en utilisant JavaScript et une base de données pour assurer la gestion et la sécurisation des données.
Fait avec ❤️ pour l'éducation à Madagascar
```

## 🙏 Remerciements

Merci à tous les contributeurs qui ont rendu ce projet possible :
- L'équipe de développement initiale
- Les établissements scolaires qui ont testé l'application
- La communauté open source pour les outils utilisés

### Technologies et bibliothèques utilisées
- [Node.js](https://nodejs.org/) - Environnement d'exécution
- [Express.js](https://expressjs.com/) - Framework web
- [MySQL](https://mysql.com/) - Base de données
- [Bootstrap](https://getbootstrap.com/) - Framework CSS
- [Chart.js](https://chartjs.org/) - Graphiques
- [jQuery](https://jquery.com/) - Bibliothèque JavaScript

---

<div align="center">
  <p>Fait avec ❤️ pour l'éducation à Madagascar</p>
  <p>© 2024 Système de Gestion d'École - Tous droits réservés</p>
</div>