const mongoose = require('mongoose'); // ← IMPORTANT

const DocumentSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['bulletin', 'certificat']
  },
  numero_matricule: {
    type: String,
    required: true,
    trim: true
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'documents'
});

module.exports = mongoose.model('Document', DocumentSchema);