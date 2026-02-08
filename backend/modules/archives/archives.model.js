const mongoose = require('mongoose');

// Modèle pour les archives des étudiants par année
const ArchiveEtudiantSchema = new mongoose.Schema({
  annee_scolaire: {
    type: String,
    required: true,
    index: true
  },
  numero_matricule: {
    type: String,
    required: true,
    trim: true
  },
  // Informations de l'étudiant au moment de l'archivage
  nom: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  prenom: {
    type: String,
    required: true,
    trim: true
  },
  niveau: {
    type: String,
    required: true,
    enum: ['Maternelles', 'Primaires', 'Premier cycle', 'Second cycle']
  },
  classe: {
    type: String,
    required: true,
    trim: true
  },
  // Résultats scolaires
  moyenne_generale: {
    type: Number,
    default: 0
  },
  decision: {
    type: String,
    enum: ['Admis', 'Redoublant', 'Sortant'],
    required: true
  },
  classe_suivante: {
    type: String,
    default: null
  },
  // Notes archivées
  notes: [{
    matiere: String,
    note: Number,
    session: String,
    date_evaluation: Date
  }],
  // Informations de contact archivées
  telephone_parent: String,
  date_naissance: Date,
  lieu_naissance: String,
  nom_pere: String,
  nom_mere: String,
  acte_numero: String,
  // Ajout du champ manquant
  acte_date: Date,
  est_vaccine: Boolean
}, {
  timestamps: true,
  collection: 'archives_etudiants'
});

// Index pour recherche rapide
ArchiveEtudiantSchema.index({ annee_scolaire: 1, numero_matricule: 1 });
ArchiveEtudiantSchema.index({ annee_scolaire: 1, decision: 1 });
ArchiveEtudiantSchema.index({ annee_scolaire: 1, classe: 1 });

// Méthode pour obtenir le nom complet
ArchiveEtudiantSchema.virtual('nomComplet').get(function() {
  return `${this.prenom} ${this.nom}`;
});

// Méthodes statiques
ArchiveEtudiantSchema.statics.archiverEtudiant = async function(etudiant, anneeScolaire, decision, classeSuivante = null) {
  const archive = new this({
    annee_scolaire: anneeScolaire,
    numero_matricule: etudiant.numero_matricule,
    nom: etudiant.nom,
    prenom: etudiant.prenom,
    niveau: etudiant.niveau,
    classe: etudiant.classe,
    decision: decision,
    classe_suivante: classeSuivante,
    telephone_parent: etudiant.telephone_parent,
    date_naissance: etudiant.date_naissance,
    lieu_naissance: etudiant.lieu_naissance,
    nom_pere: etudiant.nom_pere,
    nom_mere: etudiant.nom_mere,
    acte_numero: etudiant.acte_numero,
    acte_date: etudiant.acte_date,
    est_vaccine: etudiant.est_vaccine
  });
  
  return archive.save();
};

ArchiveEtudiantSchema.statics.getArchivesByAnnee = async function(anneeScolaire) {
  return this.find({ annee_scolaire: anneeScolaire }).sort({ nom: 1, prenom: 1 });
};

ArchiveEtudiantSchema.statics.getStatistiquesAnnee = async function(anneeScolaire) {
  const stats = await this.aggregate([
    { $match: { annee_scolaire: anneeScolaire } },
    {
      $group: {
        _id: '$decision',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const result = {
    total: 0,
    admis: 0,
    redoublants: 0,
    sortants: 0
  };
  
  stats.forEach(stat => {
    result.total += stat.count;
    if (stat._id === 'Admis') result.admis = stat.count;
    if (stat._id === 'Redoublant') result.redoublants = stat.count;
    if (stat._id === 'Sortant') result.sortants = stat.count;
  });
  
  return result;
};

module.exports = mongoose.model('ArchiveEtudiant', ArchiveEtudiantSchema);

