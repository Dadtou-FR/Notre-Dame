const mongoose = require('mongoose'); // ← IMPORTANT

const NoteSchema = new mongoose.Schema({
  annee_scolaire: {
    type: String, // ex: "2024-2025"
    index: true,
    default: null
  },
  numero_matricule: {
    type: String,
    required: true,
    trim: true
  },
  matiere: {
    type: String,
    required: true,
    trim: true
  },
  note: {
    type: Number,
    required: true,
    min: 0,
    max: 20
  },
  session: {
    type: String,
    required: true,
    enum: ['1er', '2ème', '3ème']
  },
  type_evaluation: {
    type: String,
    required: true,
    enum: ['Controle Continu', 'Examen']
  },
  commentaire: {
    type: String,
    default: null
  },
  date_evaluation: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'notes'
});

module.exports = mongoose.model('Note', NoteSchema);