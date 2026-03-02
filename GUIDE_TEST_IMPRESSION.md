# 🧪 Guide de Test - Système d'Impression et Filtrage

Date : 2 mars 2026  
Objectif : Valider le fonctionnement du système de filtrage lié à l'impression

---

## ✅ Checklist de Validation

### 🏠 Page Étudiants (`/etudiants`)

#### Test 1.1 - Bouton Imprimer Visible
```
□ Bouton "Imprimer" visible dans la barre d'outils
□ Icône 🖨️ affichée
□ Bouton a un tooltip au survol
□ Couleur grise/secondaire
```

#### Test 1.2 - Filtre Classe
```
□ Sélectionner une classe (ex: "6ème A")
□ Cliquer "Filtrer"
□ Tableau montre seulement les étudiants de cette classe
□ Cliquer "Imprimer"
□ ✓ Section "Filtres appliqués" affiche : "Classe: 6ème A"
□ ✓ En-tête "Liste des Étudiants" + date présent
□ ✓ Seuls les étudiants filtrés s'affichent
```

#### Test 1.3 - Filtre Téléphone Parent
```
□ Effacer les filtres
□ Entrer un numéro de téléphone (ex: "034 12345678")
□ Cliquer "Filtrer"
□ Tableau filtre correctement
□ Cliquer "Imprimer"
□ ✓ Section "Filtres appliqués" affiche : "Téléphone parent: 034 12345678"
```

#### Test 1.4 - Combinaison de Filtres
```
□ Classe = "5ème B"
□ Téléphone = "032"
□ Cliquer "Filtrer"
□ Cliquer "Imprimer"
□ ✓ Deux filtres affichés séparés par "|"
□ ✓ Données corresponde aux deux critères
```

#### Test 1.5 - Effacer les Filtres
```
□ Appliquer des filtres
□ Cliquer "Effacer les filtres"
□ ✓ Tous les champs se vident
□ ✓ Tous les étudiants réapparaissent
□ ✓ À l'impression, affiche "Aucun filtre appliqué"
```

---

### 👨‍🏫 Page Enseignants (`/enseignants`)

#### Test 2.1 - Bouton Imprimer
```
□ Bouton "Imprimer" visible
□ Juste à droite du filtre matière
□ Label complet "Imprimer"
```

#### Test 2.2 - Filtre Matière
```
□ Sélectionner "Mathématiques"
□ ✓ Tableau filtre immédiatement
□ Cliquer "Imprimer"
□ ✓ Section "Filtres appliqués: Matière=Mathématiques"
□ ✓ Seuls les profs de maths s'affichent
```

#### Test 2.3 - Recherche + Matière
```
□ Rechercher "Jean"
□ Matière = "Français"
□ Cliquer "Imprimer"
□ ✓ Affiche "Filtres appliqués: Recherche=Jean | Matière=Français"
□ ✓ Données correctement filtrées
```

#### Test 2.4 - Effacer les Filtres
```
□ Appliquer des filtres
□ Cliquer "Effacer les filtres"
□ ✓ Champs vidés
□ ✓ Tous les enseignants réapparaissent
□ À l'impression : "Aucun filtre appliqué"
```

---

### 💳 Page Paiements (`/paiements`)

#### Test 3.1 - Bouton Imprimer
```
□ Bouton "Imprimer" visible (icône 🖨️)
□ Dans la même rangée que les autres filtres
□ Classe "no-print" (masqué à l'impression)
```

#### Test 3.2 - Filtre Classe
```
□ Sélectionner classe "4ème A"
□ Cliquer "Imprimer"
□ ✓ Affiche "Classe: 4ème A"
□ ✓ Tableau filtrée
```

#### Test 3.3 - Filtre Statut
```
□ Classe = ""
□ Statut = "À jour"
□ Cliquer "Imprimer"
□ ✓ Affiche "Statut: À jour"
□ ✓ Données correctes
```

#### Test 3.4 - Filtre Date
```
□ Sélectionner une date (ex: "15/02/2026")
□ Cliquer "Imprimer"
□ ✓ Affiche "Date: 15 février 2026" (format FR)
□ Recherche devrait aussi filtrer par cette date
```

#### Test 3.5 - Filtre Recherche
```
□ Entrer "Mohamed" dans recherche
□ Cliquer "Imprimer"
□ ✓ Affiche "Recherche: Mohamed"
```

#### Test 3.6 - Combinaisons Multiples
```
□ Classe = "3ème B"
□ Statut = "En retard"
□ Recherche = "Ali"
□ Cliquez "Imprimer"
□ ✓ Tous les 3 filtres affichés, séparés par "|"
□ ✓ Données correspondent aux 3 critères
```

---

## 🖨️ Tests d'Impression

### Test Global d'Impression

#### Test 4.1 - Format A4
```
Imprimer chaque page et vérifier :
□ Format A4 (21cm x 29.7cm)
□ Marges visibles (15mm)
□ Pas de coupure de contenu
□ En-tête et pieds bien alignés
```

#### Test 4.2 - Affichage des Tableaux
```
□ Bordures visibles des cellules
□ En-têtes gras et distincts
□ Texte lisible (min 10pt)
□ Alternance de couleurs (gris clair)
```

#### Test 4.3 - Section Filtres
```
□ Boîte grise visible
□ Texte "Filtres appliqués" visible
□ Filtres en gras
□ Pas de débordement du contenu
```

#### Test 4.4 - En-têtes
```
□ Titre de la page visible (ex: "Liste des Étudiants")
□ Date et heure du document présentes
□ Pas d'éléments UI (boutons, formulaires)
```

#### Test 4.5 - Éléments Masqués
```
□ Pas de barre de navigation
□ Pas de sidebar
□ Pas de boutons
□ Pas de champs de recherche
□ Pas de dropdown de filtres
```

---

## 🌐 Tests Multi-Navigateurs

### Chrome/Chromium
```
□ Test 1.1 à 1.5 (Étudiants)
□ Test 2.1 à 2.4 (Enseignants)
□ Test 3.1 à 3.6 (Paiements)
□ Test 4.1 à 4.5 (Impression)
Status : ✅ / ⚠️ / ❌
```

### Firefox
```
□ Répéter tous les tests
Status : ✅ / ⚠️ / ❌
```

### Safari
```
□ Répéter tous les tests
Status : ✅ / ⚠️ / ❌
```

### Edge
```
□ Répéter tous les tests
Status : ✅ / ⚠️ / ❌
```

---

## 📱 Tests de Responsive

### Desktop (1920x1080)
```
□ Tous les éléments visibles
□ Pas de débordement horizontal
Status : ✅
```

### Tablet (768x1024)
```
□ Boutons imprimer visible
□ Filtres restent accessibles
Status : ✅
```

### Mobile (375x667)
```
□ Impression fonctionne (avec wireless printer)
□ Interface reste usable
Status : ✅ / ⚠️
```

---

## 🔧 Tests Fonctionnels Avancés

### Test 5.1 - Mise à Jour en Temps Réel
```
□ Changer un filtre sans cliquer "Filtrer"
□ Pour etudiants : affichage immédiat ? ⚠️
  (Note: Cette page nécessite "Filtrer")
□ Pour enseignants : affichage immédiat ? ✅
□ Pour paiements : affichage immédiat ? ✅
```

### Test 5.2 - Affichage des Filtres
```
□ Changer filtre → Section "Filtres appliqués" se met à jour
□ Sans cliquer "Imprimer" ni "Filtrer"
□ Le texte s'actualise immédiatement
```

### Test 5.3 - Combinaison Complexe
```
Étudiants :
  □ Classe = "7ème A"
  □ Téléphone = "0341"
  
Enseignants :
  □ Recherche = "Marie"
  □ Matière = "Français"
  
Paiements :
  □ Classe = "6ème B"
  □ Statut = "En retard"
  □ Recherche = "Jean"
  □ Date = "01/03/2026"
  
✓ Tous les filtres s'appliquent correctement
✓ Seules les données correspondantes s'affichent
✓ À l'impression, tous les filtres sont visibles
```

### Test 5.4 - Effacer et Réappliquer
```
□ Appliquer plusieurs filtres
□ Effacer → Tout revient à zéro
□ Réappliquer les mêmes filtres
□ ✓ Les mêmes résultats
```

---

## 🎨 Tests Visuels

### Test 6.1 - Cohérence Visuelle
```
Écran Normal vs Aperçu Impression :
□ Les éléments "print-only" ne sont pas visibles écran
□ Les éléments "no-print" ne sont pas visibles à l'impression
□ Les couleurs sont convenables en B&W
```

### Test 6.2 - Lisibilité
```
À l'impression :
□ Texte noir sur fond blanc
□ Tableaux avec bordures visibles
□ En-têtes distincts (gras, background)
□ Badges avec bordures noires
```

### Test 6.3 - Espacement
```
À l'impression :
□ Marges de 15mm tous côtés
□ Pas d'éléments qui débordent
□ Espacement régulier entre sections
```

---

## 📊 Rapport de Test

### Résumé des Tests Complétés

| Test | Statut | Notes |
|------|--------|-------|
| 1.1 Bouton Imprimer Étudiants | ✅/⚠️/❌ | |
| 1.2 Filtre Classe | ✅/⚠️/❌ | |
| 1.3 Filtre Téléphone | ✅/⚠️/❌ | |
| 1.4 Filtres Combinés | ✅/⚠️/❌ | |
| 1.5 Effacer Filtres | ✅/⚠️/❌ | |
| 2.1 Bouton Imprimer Enseignants | ✅/⚠️/❌ | |
| 2.2 Filtre Matière | ✅/⚠️/❌ | |
| 2.3 Recherche + Matière | ✅/⚠️/❌ | |
| 2.4 Effacer Filtres | ✅/⚠️/❌ | |
| 3.1 Bouton Imprimer Paiements | ✅/⚠️/❌ | |
| 3.2-3.6 Filtres Paiements | ✅/⚠️/❌ | |
| 4.1-4.5 Format d'Impression | ✅/⚠️/❌ | |
| 5.1-5.4 Tests Avancés | ✅/⚠️/❌ | |
| 6.1-6.3 Tests Visuels | ✅/⚠️/❌ | |

### Légende
- ✅ Test réussi
- ⚠️ Test partiel/avec problème mineur
- ❌ Test échoué/ne fonctionne pas

---

## 🚀 Procédure de Déploiement Finale

Avant de déployer en production :

```bash
# 1. Vider le cache du navigateur
Ctrl+Shift+Delete
  ✓ Cookies et données de site
  ✓ Images et fichiers en cache
  ✓ Fichiers en cache

# 2. Recharger la page
Ctrl+F5

# 3. Exécuter cette checklist complète
- Test Étudiants : ALL ✅
- Test Enseignants : ALL ✅
- Test Paiements : ALL ✅
- Test Impression : ALL ✅
- Test Multi-navigateurs : ALL ✅

# 4. Validation finale
Tous les tests : ✅ ???
  → Déployer en production
  → Aucun test ❌ ???
  → Ne pas valider, corriger d'abord
```

---

## 📞 Contacts Support

En cas de problème :
1. Vérifier JavaScript activé (F12 → Console)
2. Aucune erreur rouge → Bon
3. Erreur rouge → Correction nécessaire
4. Contacter admin système

---

**Test Schedule** : [à remplir par le testeur]  
**Testeur** : [nom à ajouter]  
**Date** : [date à ajouter]  
**Signature** : _______________

---

*Guide de test version 2.0 - 2 mars 2026*
