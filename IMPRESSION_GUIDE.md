# Guide d'Impression et Filtrage - Gestion d'École

## 📋 Vue d'ensemble

Le système de gestion d'école intègre maintenant un système complet de **filtrage lié à l'impression**. Lorsque vous appliquez des filtres et que vous imprimez, seules les données filtrées s'affichent de manière professionnelle sur papier A4.

---

## 🎯 Fonctionnalités Principales

### 1. **Filtrage des Données**
Sur les pages suivantes, vous pouvez filtrer les données :
- **Étudiants** : Classe, téléphone parent
- **Enseignants** : Matière enseignée
- **Paiements** : Classe, statut (À jour/En retard), date, recherche

### 2. **Bouton Imprimer**
Un bouton **Imprimer** est disponible sur chaque page :
- 🖨️ Affiche un aperçu avant impression
- Les éléments de navigation sont masqués
- Seules les données filtrées s'affichent
- Format optimisé pour papier A4

### 3. **Résumé des Filtres Appliqués**
À l'impression, un encadré **"Filtres appliqués"** indique :
- Les filtres actuellement actifs
- Les critères de recherche utilisés

---

## 📖 Guide Étape par Étape

### **Page Étudiants**

#### Filtrage :
1. Accédez à la page **Étudiants**
2. Utilisez les champs de filtre :
   - **Classe** : Sélectionnez une classe (ex: 6ème A)
   - **Téléphone parent** : Entrez un numéro de téléphone
3. Cliquez sur **Filtrer** pour appliquer les critères
4. Pour réinitialiser, cliquez sur **Effacer les filtres**

#### Impression :
1. Après avoir appliqué vos filtres, cliquez sur le bouton **Imprimer** 
   (`<i class="fas fa-print"></i> Imprimer`)
2. Dans l'aperçu avant impression :
   - Vous verrez l'en-tête "Liste des Étudiants" avec la date
   - Les filtres appliqués seront listés dans une boîte en haut
   - Seuls les étudiants correspondant aux critères s'affichent
3. Cliquez sur **Imprimer** (Ctrl+P) pour générer le document

---

### **Page Enseignants**

#### Filtrage :
1. Accédez à la page **Enseignants**
2. Utilisez les champs de filtre :
   - **Recherche** : Recherchez par nom
   - **Matière** : Filtrez par matière enseignée
3. Les résultats se mettent à jour automatiquement
4. Pour réinitialiser, cliquez sur **Effacer les filtres**

#### Impression :
1. Cliquez sur le bouton **Imprimer** 
2. Un aperçu affiche :
   - L'en-tête "Liste des Enseignants"
   - Les filtres appliqués (recherche, matière)
   - Les enseignants filtrés dans un tableau
3. Imprimez avec Ctrl+P

---

### **Page Paiements**

#### Filtrage :
1. Accédez à la page **Paiements**
2. Utilisez les filtres suivants :
   - **Recherche** : Nom ou matricule
   - **Date** : Sélectionnez une date
   - **Classe** : Choisissez une classe
   - **Statut** : À jour / En retard
3. Les filtres s'appliquent dynamiquement

#### Impression :
1. Cliquez sur le bouton **Imprimer** (icône 🖨️)
2. L'aperçu montre :
   - L'en-tête "État des Paiements de Scolarité"
   - Les filtres appliqués détaillés
   - Le tableau des paiements filtré
   - Les données correspondent à vos critères
3. Imprimez avec Ctrl+P

---

## 🎨 Format d'Impression (A4)

### Caractéristiques d'Impression :

✅ **Marges** : Optimisées pour l'A4 (15mm)
✅ **Résolution** : 300 DPI recommandé
✅ **Police** : Segoe UI, 11pt pour le texte, 10pt pour les tableaux
✅ **Sauts de page** : Automatiques pour les éléments volumineux
✅ **En-têtes** : Titre et date de génération
✅ **Tableaux** : Bordures, en-têtes répétés
✅ **Couleurs** : Conversion en niveaux de gris si paramétré

### Paramètres Conseillés :

Pour une meilleure impression :
1. Ouvrez le **Prévisualiseur d'impression** (Ctrl+P)
2. Configurez :
   - **Format** : A4
   - **Marges** : Standard
   - **Couleur de fond** : Désactivée (sauf si nécessaire)
   - **En-têtes/Pieds** : Peut être désactivé
3. Cliquez sur **Imprimer**

---

## 📊 Exemples de Cas d'Utilisation

### Cas 1 : Imprimer les étudiants d'une classe
```
1. Allez à Étudiants
2. Classe = "6ème A"
3. Cliquez Filtrer
4. Cliquez Imprimer
→ Liste A4 des étudiants de 6ème A
```

### Cas 2 : État des paiements pour une classe spécifique
```
1. Allez à Paiements
2. Classe = "5ème B"
3. Cliquez Imprimer
→ Tableau A4 des paiements de 5ème B
```

### Cas 3 : Liste des enseignants de Français
```
1. Allez à Enseignants
2. Matière = "Français"
3. Cliquez Imprimer
→ Annuaire A4 des professeurs de Français
```

---

## ⚙️ Astuces et Conseils

### 💡 Astuces Utiles

✨ **Combinez plusieurs filtres** : Filtrera par classe ET statut pour les paiements
✨ **Aperçu avant impression** : Vérifiez l'affichage avant d'imprimer
✨ **JavaScript désactivé** : Les boutons imprimer utilisent `window.print()`
✨ **Export** : Utilisez également CSV/Excel pour les données non-imprimées
✨ **Historique d'impression** : Gardez un journal des impressions pour l'audit

### 🛠️ Dépannage

| Problème | Solution |
|----------|----------|
| Le filtre n'est pas affiché à l'impression | Vérifiez que vous avez cliqué sur "Filtrer" |
| L'impression n'affiche que les en-têtes | Page vide → Appliquez un filtre moins restrictif |
| Mauvais format des données | Vérifiez les paramètres d'impression (A4, marges) |
| Texte coupé dans les colonnes | Réduisez les marges ou utilisez l'orientation paysage |

---

## 📄 Spécifications Techniques

### Styles d'Impression (@media print)

```css
/* Masqué à l'impression */
.no-print { display: none !important; }

/* Affiché SEULEMENT à l'impression */
.print-only { display: block !important; }

/* Page A4 avec marges */
@page { size: A4; margin: 15mm; }

/* Tableaux optimisés */
thead { display: table-header-group; }
tbody { page-break-inside: avoid; }
```

### Navigateurs Supportés

- ✅ Chrome/Chromium (Recommandé)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ❌ Internet Explorer (Non supporté)

---

## 📞 Support

Pour toute question ou problème relatif à l'impression :
1. Vérifiez que JavaScript est activé
2. Essayez avec un autre navigateur
3. Consultez les traces de navigateur (F12)
4. Contactez l'administrateur système

---

## 📅 Mises à Jour Récentes

### Version 2.0 (2026-03-02)

- ✅ Intégration complète des filtres avec l'impression
- ✅ Support A4 optimisé
- ✅ Affichage des filtres appliqués
- ✅ En-têtes et dates d'impression
- ✅ Amélioration des styles CSS
- ✅ Support multi-navigateurs

---

**Dernière mise à jour** : 2 mars 2026
**Version** : 2.0
