const mongoose = require('mongoose');

const ArchivePaiementSchema = new mongoose.Schema({
  annee_scolaire: { type: String, required: true, index: true },
  annee_numeric: { type: Number, default: null, index: true },
  date_archivage: { type: Date, default: Date.now },
  total_paiements: { type: Number, default: 0 },
  nombre_documents: { type: Number, default: 0 },
  paiements: [{
    numero_matricule: String,
    type_paiement: String,
    mois: String,
    annee: Number,
    montant: Number,
    date_paiement: Date,
    methode_paiement: String,
    statut: String,
    remarques: String
  }]
}, {
  timestamps: true,
  collection: 'archives_paiements'
});

ArchivePaiementSchema.index({ annee_scolaire: 1 });

ArchivePaiementSchema.statics.creerArchive = async function(anneeLabel, anneeNumeric, paiementsArray) {
  const total = paiementsArray.reduce((s, p) => s + (p.montant || 0), 0);
  const doc = new this({
    annee_scolaire: anneeLabel,
    annee_numeric: anneeNumeric || null,
    total_paiements: total,
    nombre_documents: paiementsArray.length,
    paiements: paiementsArray
  });
  return doc.save();
};

module.exports = mongoose.model('ArchivePaiement', ArchivePaiementSchema);
