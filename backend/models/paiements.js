// modules/paiements/paiements.model.js

const mongoose = require('mongoose');

const PaiementSchema = new mongoose.Schema({
  annee_scolaire: {
    type: String, // ex: "2024-2025"
    index: true,
    default: null
  },
  // Référence à l'étudiant
  numero_matricule: {
    type: String,
    required: [true, 'Le numéro de matricule est requis'],
    trim: true,
    index: true
  },
  
  // Type de paiement
  type_paiement: {
    type: String,
    required: [true, 'Le type de paiement est requis'],
    enum: ['Droit', 'Scolarité', 'Cantine', 'Transport', 'Fournitures', 'Activités'],
    default: 'Scolarité'
  },
  
  // Période du paiement
  mois: {
    type: String,
    required: [true, 'Le mois est requis'],
    enum: [
      'Droit', // Pour le droit d'inscription
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ]
  },
  
  annee: {
    type: Number,
    required: [true, 'L\'année est requise'],
    min: 2020,
    max: 2100,
    default: () => new Date().getFullYear()
  },
  
  // Montant
  montant: {
    type: Number,
    required: [true, 'Le montant est requis'],
    min: [0, 'Le montant doit être positif']
  },
  
  // Date de paiement
  date_paiement: {
    type: Date,
    required: [true, 'La date de paiement est requise'],
    default: Date.now
  },
  
  // Méthode de paiement
  methode_paiement: {
    type: String,
    enum: ['Espèces', 'Chèque', 'Virement', 'Mobile Money'],
    default: 'Espèces'
  },
  
  // Statut
  statut: {
    type: String,
    enum: ['Payé', 'En retard', 'Non payé'],
    default: 'Payé'
  },
  
  // Remarques
  remarques: {
    type: String,
    trim: true,
    default: null
  }
}, {
  timestamps: true,
  collection: 'paiements'
});

// Index composé pour éviter les doublons
PaiementSchema.index({ numero_matricule: 1, mois: 1, annee: 1, type_paiement: 1 }, { unique: true });

// Index pour recherche rapide
PaiementSchema.index({ date_paiement: -1 });
PaiementSchema.index({ statut: 1 });

// Méthode pour vérifier si un paiement est en retard
PaiementSchema.methods.estEnRetard = function() {
  if (this.statut === 'Payé') return false;
  
  const maintenant = new Date();
  const moisIndex = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ].indexOf(this.mois);
  
  if (moisIndex === -1) return false; // Droit d'inscription
  
  const dateLimite = new Date(this.annee, moisIndex + 1, 10); // 10 du mois suivant
  return maintenant > dateLimite;
};

// Méthode statique pour obtenir les paiements par étudiant
PaiementSchema.statics.getPaiementsParEtudiant = async function(annee = new Date().getFullYear()) {
  const Etudiant = mongoose.model('Etudiant');
  const etudiants = await Etudiant.find().lean();
  
  const resultats = [];
  
  for (const etudiant of etudiants) {
    const paiements = await this.find({
      numero_matricule: etudiant.numero_matricule,
      annee: annee
    }).lean();
    
    // Structure des paiements mensuels
    const mois = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    
    const paiementsMensuels = {};
    mois.forEach(m => {
      const paiement = paiements.find(p => p.mois === m && p.type_paiement === 'Scolarité');
      paiementsMensuels[m] = {
        paye: !!paiement,
        montant: paiement ? paiement.montant : 0,
        datePaiement: paiement ? new Date(paiement.date_paiement).toLocaleDateString('fr-FR') : null,
        enRetard: false, // Désactivé pour permettre l'ajout manuel des paiements
        id: paiement ? paiement._id : null
      };
    });
    
    // Droit d'inscription
    const droitInscription = paiements.find(p => p.mois === 'Droit' && p.type_paiement === 'Droit');

    // Calcul du total
    const totalPaye = paiements.reduce((sum, p) => sum + p.montant, 0);

    resultats.push({
      etudiant,
      droitInscription: {
        paye: !!droitInscription,
        montant: droitInscription ? droitInscription.montant : 0,
        datePaiement: droitInscription ? new Date(droitInscription.date_paiement).toLocaleDateString('fr-FR') : null,
        id: droitInscription ? droitInscription._id : null
      },
      paiementsMensuels,
      totalPaye
    });
  }
  
  return resultats;
};

// Fonction helper pour vérifier si un mois est en retard
function estMoisEnRetard(mois, annee) {
  const maintenant = new Date();
  const moisIndex = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ].indexOf(mois);
  
  if (moisIndex === -1) return false;
  
  // Date limite: 10 du mois suivant
  const dateLimite = new Date(annee, moisIndex + 1, 10);
  return maintenant > dateLimite;
}

module.exports = mongoose.model('Paiement', PaiementSchema);