const mongoose = require('mongoose'); // ← CETTE LIGNE DOIT ÊTRE EN PREMIER

const EnseignantSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true
  },
  prenom: {
    type: String,
    required: [true, 'Le prénom est requis'],
    trim: true
  },
  matiere: {
    type: String,
    required: [true, 'La matière est requise'],
    trim: true
  },
  telephone: {
    type: String,
    required: [true, 'Le téléphone est requis'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    default: null
  },
  date_embauche: {
    type: Date,
    default: null
  },
  classes: {
    type: [String],
    default: []
  }
}, {
  timestamps: true,
  collection: 'enseignants'
});

module.exports = mongoose.model('Enseignant', EnseignantSchema);