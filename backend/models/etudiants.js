const mongoose = require('mongoose');

const etudiantSchema = new mongoose.Schema({
  annee_scolaire: {
    type: String, // ex: "2024-2025"
    index: true,
    default: null
  },
  // Informations de base (OBLIGATOIRES)
  numero_matricule: {
    type: String,
    required: [true, 'Le numéro de matricule est requis'],
    unique: true,
    trim: true,
    index: true
  },
  nom: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true,
    uppercase: true
  },
  prenom: {
    type: String,
    required: [true, 'Le prénom est requis'],
    trim: true
  },
  niveau: {
    type: String,
    required: [true, 'Le niveau est requis'],
    enum: ['Maternelles', 'Primaires', 'Premier cycle', 'Second cycle'],
  },
  classe: {
    type: String,
    required: [true, 'La classe est requise'],
    trim: true
  },
  telephone_parent: {
    type: String,
    required: [true, 'Le téléphone du parent est requis'],
    trim: true
  },
  est_vaccine: {
    type: Boolean,
    default: false
  },
  
  // Informations personnelles (OPTIONNELLES)
  date_naissance: {
    type: Date,
    default: null
  },
  lieu_naissance: {
    type: String,
    trim: true,
    default: null
  },
  nom_pere: {
    type: String,
    trim: true,
    default: null
  },
  nom_mere: {
    type: String,
    trim: true,
    default: null
  },
  acte_numero: {
    type: String,
    trim: true,
    default: null
  },
  acte_date: {
    type: Date,
    default: null
  }
}, {
  timestamps: true, // Ajoute automatiquement createdAt et updatedAt
  collection: 'etudiants'
});

// Index pour recherche rapide
etudiantSchema.index({ nom: 1, prenom: 1 });
etudiantSchema.index({ classe: 1 });
etudiantSchema.index({ niveau: 1 });

// Méthode pour obtenir le nom complet
etudiantSchema.virtual('nomComplet').get(function() {
  return `${this.prenom} ${this.nom}`;
});

// Avant la sauvegarde, nettoyer les données
// Normalisation avant validation pour s'assurer que `niveau` respecte l'enum
etudiantSchema.pre('validate', function(next) {
  // Mettre le nom en majuscules
  if (this.nom) {
    this.nom = this.nom.toUpperCase();
  }
  
  // Capitaliser le prénom
  if (this.prenom) {
    this.prenom = this.prenom.charAt(0).toUpperCase() + this.prenom.slice(1).toLowerCase();
  }
  
  // Normaliser le champ `niveau` si nécessaire.
  // Parfois `niveau` a été enregistré avec la classe (ex: 'CM2') au lieu du groupe (ex: 'Primaires').
  const classeToNiveau = {
    'PS': 'Maternelles', 'MS': 'Maternelles', 'GS': 'Maternelles',
    'CP': 'Primaires', 'CE1': 'Primaires', 'CE2': 'Primaires', 'CM1': 'Primaires', 'CM2': 'Primaires',
    '6ème': 'Premier cycle', '5ème': 'Premier cycle', '4ème': 'Premier cycle', '3ème': 'Premier cycle',
    '2nde': 'Second cycle', '1ère': 'Second cycle', 'Tle': 'Second cycle'
  };

  // Si niveau est une classe connue, la remplacer par le groupe correspondant
  if (this.niveau && classeToNiveau[this.niveau]) {
    this.niveau = classeToNiveau[this.niveau];
  }

  // Si niveau est manquant mais la classe est renseignée, inférer le niveau depuis la classe
  if ((!this.niveau || this.niveau === '') && this.classe && classeToNiveau[this.classe]) {
    this.niveau = classeToNiveau[this.classe];
  }

  next();
});

// Hook pour normaliser les mises à jour via findOneAndUpdate / updateOne
etudiantSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
  const update = this.getUpdate() || {};
  // Normaliser si on met à jour `niveau` directement
  if (update.niveau) {
    const classeToNiveau = {
      'PS': 'Maternelles', 'MS': 'Maternelles', 'GS': 'Maternelles',
      'CP': 'Primaires', 'CE1': 'Primaires', 'CE2': 'Primaires', 'CM1': 'Primaires', 'CM2': 'Primaires',
      '6ème': 'Premier cycle', '5ème': 'Premier cycle', '4ème': 'Premier cycle', '3ème': 'Premier cycle',
      '2nde': 'Second cycle', '1ère': 'Second cycle', 'Tle': 'Second cycle'
    };

    if (classeToNiveau[update.niveau]) {
      update.niveau = classeToNiveau[update.niveau];
      this.setUpdate(update);
    }
  }

  // Si on met à jour la `classe` et que `niveau` n'est pas fourni, inférer niveau
  if (update.classe && !update.niveau) {
    const classeToNiveau = {
      'PS': 'Maternelles', 'MS': 'Maternelles', 'GS': 'Maternelles',
      'CP': 'Primaires', 'CE1': 'Primaires', 'CE2': 'Primaires', 'CM1': 'Primaires', 'CM2': 'Primaires',
      '6ème': 'Premier cycle', '5ème': 'Premier cycle', '4ème': 'Premier cycle', '3ème': 'Premier cycle',
      '2nde': 'Second cycle', '1ère': 'Second cycle', 'Tle': 'Second cycle'
    };

    if (classeToNiveau[update.classe]) {
      update.niveau = classeToNiveau[update.classe];
      this.setUpdate(update);
    }
  }

  next();
});

module.exports = mongoose.model('Etudiant', etudiantSchema);