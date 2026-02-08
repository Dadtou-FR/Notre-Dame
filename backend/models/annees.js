const mongoose = require('mongoose');

const AnneeScolaireSchema = new mongoose.Schema({
  annee_label: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  est_active: {
    type: Boolean,
    default: false,
    index: true
  },
  date_debut: {
    type: Date,
    required: true
  },
  date_fin: {
    type: Date,
    required: true
  }
}, {
  timestamps: true,
  collection: 'annees_scolaires'
});

// S'assurer qu'une seule année est active à la fois
AnneeScolaireSchema.statics.setActive = async function(id) {
  await this.updateMany({ est_active: true }, { $set: { est_active: false } });
  return this.findByIdAndUpdate(id, { $set: { est_active: true } }, { new: true });
};

AnneeScolaireSchema.statics.getActive = async function() {
  // Retourne un document Mongoose (pas .lean()) pour permettre save() ensuite
  return this.findOne({ est_active: true });
};

// Récupérer toutes les années archivées (non actives)
AnneeScolaireSchema.statics.getArchives = async function() {
  return this.find({ est_active: false }).sort({ date_debut: -1 }).lean();
};

// Archiver une année (basculer est_active à false) - accepte un id
AnneeScolaireSchema.statics.archiverAnnee = async function(id) {
  return this.findByIdAndUpdate(id, { $set: { est_active: false } }, { new: true });
};

// Créer une nouvelle année scolaire et la définir comme active
AnneeScolaireSchema.statics.creerNouvelleAnnee = async function(label, dateDebut, dateFin) {
  // Désactiver l'année active actuelle
  await this.updateMany({ est_active: true }, { $set: { est_active: false } });

  const nouvelle = new this({
    annee_label: label,
    est_active: true,
    date_debut: dateDebut,
    date_fin: dateFin
  });

  return nouvelle.save();
};

module.exports = mongoose.model('AnneeScolaire', AnneeScolaireSchema);


