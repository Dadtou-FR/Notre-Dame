# 🔧 SPÉCIFICATIONS TECHNIQUES

## 📋 Résumé des Modifications

### Fichiers Modifiés:
- ✅ `views/note_add.ejs` - Formulaire de saisie (13.3 KB)
- ✅ `views/bulletin.ejs` - Bulletin officiel (30.7 KB)

---

## 📚 Structure EJS (Templates)

### **note_add.ejs** - Structure:

```
1. En-tête professionnel (gradient)
2. Instructions utilisateur
3. Formulaire:
   ├─ Section "Informations de l'élève"
   │  ├─ Input: numero_matricule
   │  ├─ Select: session (1er/2ème/3ème Trimestre)
   │  └─ Select: type_evaluation (INT/Exam)
   │
   └─ Section "Tableau des Notes"
      └─ Table dynamique 12 matières x 3 colonnes
         ├─ Matière (text)
         ├─ Note (number 0-20 step 0.5)
         └─ Commentaire (text)
4. Boutons d'action (Valider/Annuler)
5. Script JavaScript (Validation + Liaison dropdown)
```

### **bulletin.ejs** - Structure:

```
1. Barre de recherche (autocomplète)
2. Bulletin (si étudiant trouvé):
   ├─ En-tête officiel
   ├─ Infos élève (grid 2 colonnes)
   ├─ Tableau notes (6 colonnes):
   │  ├─ Matière
   │  ├─ 1er Trimestre
   │  ├─ 2e Trimestre
   │  ├─ 3e Trimestre
   │  ├─ Moyenne annuelle
   │  └─ Appréciation
   ├─ Section Moyennes (grid 4 cases)
   ├─ Décision du Conseil (gradient)
   ├─ Pied de page (cachet + signature)
   └─ Boutons (PDF + Imprimer + Retour)
3. Script JavaScript:
   ├─ Autocomplète search
   ├─ Génération PDF (html2pdf.js)
   └─ Date automatique
```

---

## 🎨 CSS Utilisé

### Couleurs:
```css
:root {
  --primary: #667eea;           /* Bleu-Violet */
  --primary-dark: #764ba2;      /* Violet foncé */
  --text-dark: #2c3e50;         /* Gris très foncé */
  --text-light: #7f8c8d;        /* Gris clair */
  --success: #d4edda;           /* Vert clair */
  --warning: #fff3cd;           /* Jaune clair */
  --danger: #f8d7da;            /* Rouge clair */
}
```

### Classes Principales:
```css
/* note_add.ejs */
.notes-container         /* En-tête gradient */
.form-section-title      /* Titres de section */
.matiere-row            /* Ligne de matière */
.note-input             /* Champ note */
.btn-group-custom       /* Groupe de boutons */

/* bulletin.ejs */
.search-container       /* Barre de recherche */
.bulletin-container     /* Container principal */
.bulletin-header        /* En-tête */
.student-info          /* Infos élève */
.table-notes           /* Tableau */
.moyennes-section      /* Section moyennes */
.decision-section      /* Décision conseil */
.bulletin-footer       /* Pied de page */

/* Couleurs notes */
.note-excellent        /* ≥ 18: Vert */
.note-bien            /* 14-15.99: Bleu */
.note-moyen           /* 10-13.99: Jaune */
.note-insuffisant     /* < 10: Rouge */
```

---

## 🔗 API et Routes

### Requêtes GET:
```
GET /notes/add          → Affiche le formulaire
GET /bulletin           → Affiche la page de recherche
GET /api/search-etudiants?q=query  → Autocomplète (JSON)
```

### Requêtes POST:
```
POST /notes/add-batch   → Enregistre les notes
```

### Requêtes AJAX (JavaScript):
```
fetch(/api/search-etudiants?q=<query>)
  → Response: [{numero_matricule, prenom, nom}, ...]
```

---

## 🔢 Données Requises

### Collection MongoDB - `etudiants`:
```javascript
{
  _id: ObjectId,
  numero_matricule: String (unique),
  prenom: String,
  nom: String,
  classe: String,
  niveau: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Collection MongoDB - `notes`:
```javascript
{
  _id: ObjectId,
  numero_matricule: String (index),
  matiere: String,
  note: Number (0-20),
  session: String,           /* 1er/2ème/3ème Trimestre */
  type_evaluation: String,   /* INT 1er/2ème/3ème, Exam 1er/2ème/3ème */
  commentaire: String (optional),
  date_evaluation: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile First */
@media (min-width: 480px) { /* Mobile */ }
@media (min-width: 768px) { /* Tablette */ }
@media (min-width: 1024px) { /* Laptop */ }
@media (min-width: 1920px) { /* Desktop 4K */ }

/* Print */
@media print { 
  /* Masquer navigation */
  /* Optimiser mise en page A4 */
}
```

---

## 🧮 Logique de Calcul (JavaScript)

### Moyenne par matière:
```javascript
function getAnnualAverage(matiere) {
  const notes = trimesters
    .map(t => notesByMatiere[matiere][t])
    .filter(n => n !== null);
  
  if (notes.length === 0) return null;
  return (notes.reduce((a,b) => a+b, 0) / notes.length)
    .toFixed(2);
}
```

### Appréciation:
```javascript
function getAppreciation(note) {
  if (note === null) return '—';
  const n = parseFloat(note);
  if (n >= 18) return 'Excellent – Travail remarquable';
  if (n >= 16) return 'Très bien – Très bon niveau';
  if (n >= 14) return 'Bien – Bon travail';
  if (n >= 12) return 'Assez bien – Efforts satisfaisants';
  if (n >= 10) return 'Passable – Peut mieux faire';
  return 'Insuffisant – Doit fournir plus d\'efforts';
}
```

### Décision du Conseil:
```javascript
if (annualAverage >= 16) {
  decision = 'Admis(e) avec félicitations';
} else if (annualAverage >= 14) {
  decision = 'Admis(e)';
} else if (annualAverage >= 12) {
  decision = 'Admis(e) avec encouragements';
} else if (annualAverage >= 10) {
  decision = 'Admis(e) sous réserve';
} else {
  decision = 'Redoublement conseillé';
}
```

---

## 📦 Dépendances Externes

```html
<!-- Bootstrap 5 (CSS/JS) -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">

<!-- Font Awesome (Icônes) -->
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">

<!-- HTML2PDF (Export PDF) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
```

---

## ✅ Validation

### Côté Client (JavaScript):
```javascript
// note_add.ejs
- Matricule: required, non-vide
- Session: required, non-vide
- Type evaluation: required, non-vide
- Notes: au moins 1 note obligatoire
- Notes: format number 0-20

// bulletin.ejs
- Matricule recherche: minimum 2 caractères
- Autocomplète: sélection parmi liste
```

### Côté Serveur (Node.js):
```javascript
// POST /notes/add-batch
- Valider numero_matricule
- Valider session enum
- Valider type_evaluation enum
- Valider notes: 0-20 numeric
- Valider matière dans liste autorisée
- Vérifier authentification
```

---

## 🎯 Performance

### Optimisations:
- ✅ CSS en inline (gain 1 requête)
- ✅ JavaScript vanille (pas jQuery)
- ✅ Grid/Flexbox (pas table layout)
- ✅ Lazy loading images (si future ajout)
- ✅ Minification CSS/JS possible

### Temps de chargement estimé:
- Page de saisie: < 500ms
- Page de bulletin: < 1s (avec 12 matières)
- Export PDF: 2-3s (html2pdf.js)

---

## 🔐 Sécurité

### Implémentations:
- ✅ CSRF protection (via session/tokens)
- ✅ XSS prevention (EJS échappe par défaut)
- ✅ SQL injection N/A (MongoDB)
- ✅ Input validation (client + serveur)
- ✅ Authentication check requis

### Recommandations:
- Utiliser HTTPS en production
- Ajouter rate limiting sur /api/search-etudiants
- Logger les modifications de notes
- Backup régulière MongoDB
- Chiffrer données sensibles

---

## 📊 Sélection de Matières

**12 matières standards francophones collège/lycée:**

1. Catéchèse
2. Philosophie / Initiation
3. Malagasy (langue locale)
4. Français
5. Anglais
6. Espagnol
7. Histoire - Géographie
8. Mathématiques
9. Physique - Chimie
10. SVT (Sciences de la Vie et de la Terre)
11. Informatique
12. EPS (Éducation Physique et Sportive)

---

## 🎓 Niveaux et Classes

**Typiquement:**
- 6ème, 5ème, 4ème, 3ème (Collège)
- Seconde, Première, Terminale (Lycée)

Classes par niveau:
- 6ème A, 6ème B, 6ème C...
- 1ère S, 1ère ES, 1ère L...

---

## 🌍 Localisation

**Langue:** Français (prédéfini)
**Établissement:** École Catholique Notre-Dame, Mahajanga, Madagascar
**Format date:** dd/mm/yyyy
**Format note:** 0-20 (standard français)
**Année scolaire:** Sept-Juin (ex: 2024-2025)

---

## 📅 Trimestres

**Calendrier scolaire:**
- **1er Trimestre**: Septembre-Décembre
- **2ème Trimestre**: Janvier-Mars
- **3ème Trimestre**: Avril-Juin

**Types d'évaluation:**
- INT = Interrogation/Contrôle
- Exam = Examen

---

## 📈 Statistiques & Rapports

**Possibles futures améliorations:**
- Graphiques de progression
- Comparaison classe/niveau
- Palmarès élèves
- Alertes notes insuffisantes
- Export Excel classe entière
- Dashboard directeur

---

## 🚀 Déploiement

```bash
# 1. Cloner/Pusher les modifications
git add views/note_add.ejs views/bulletin.ejs
git commit -m "Refonte bulletins et notes (design professionnel)"
git push

# 2. Redémarrer l'application
npm restart

# 3. Tester les URLs
http://localhost:8080/notes/add
http://localhost:8080/bulletin

# 4. Vérifier MongoDB
db.notes.find().limit(1)
```

---

## 📝 Version Info

```
Nom du projet: GestionEcole
Module: Notes & Bulletins
Version: 1.0 - Professionnel
Date: 4 février 2026
Auteur: Expert AI Copilot
État: ✅ Production Ready
```

---

**Fin des spécifications techniques**
