const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Définition des rôles disponibles
const ROLES = {
  ADMIN: 'admin',
  SECRETAIRE: 'secretaire',
  CAISSIERE: 'caissiere',
  ENSEIGNANT: 'enseignant'
};

// Configuration des permissions par rôle
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: {
    // accès complet au système
    canManageUsers: true,
    canManageEtudiants: true,
    canManageEnseignants: true,
    canManagePaiements: true,
    canManageNotes: true,
    canManageAnnees: true,
    canViewStats: true,
    canGenerateCertificats: true,
    canGenerateBulletins: true,
    canViewNotes: true
  },
  [ROLES.SECRETAIRE]: {
    // secrétaire : élèves, gestion des enseignants/matières, inscriptions (années/transitions) et bulletins
    canManageUsers: false,
    canManageEtudiants: true,
    canManageEnseignants: true,
    canManagePaiements: false,
    canManageNotes: false,
    canManageAnnees: true,
    canViewStats: false,
    canGenerateCertificats: false,
    canGenerateBulletins: true,
    canViewNotes: false
  },
  [ROLES.CAISSIERE]: {
    // caissière : uniquement paiements (navigation limitée)
    canManageUsers: false,
    canManageEtudiants: false,
    canManageEnseignants: false,
    canManagePaiements: true,
    canManageNotes: false,
    canManageAnnees: false,
    canViewStats: false,
    canGenerateCertificats: false,
    canGenerateBulletins: false,
    canViewNotes: false
  },
  [ROLES.ENSEIGNANT]: {
    // enseignant : consultation et gestion des notes/classe
    canManageUsers: false,
    canManageEtudiants: false,
    canManageEnseignants: false,
    canManagePaiements: false,
    canManageNotes: true,
    canManageAnnees: false,
    canViewStats: false,
    canGenerateCertificats: false,
    canGenerateBulletins: false,
    canViewNotes: true
  }
};

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    enum: [ROLES.ADMIN, ROLES.SECRETAIRE, ROLES.CAISSIERE, ROLES.ENSEIGNANT], 
    default: ROLES.ENSEIGNANT 
  },
  // Champs supplémentaires pour le profil
  nom: { type: String, trim: true },
  prenom: { type: String, trim: true },
  email: { type: String, trim: true },
  telephone: { type: String, trim: true },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date }
});

// Méthode pour vérifier les permissions
UserSchema.methods.hasPermission = function(permission) {
  const permissions = ROLE_PERMISSIONS[this.role];
  return permissions ? permissions[permission] : false;
};

// Méthode pour obtenir toutes les permissions
UserSchema.methods.getPermissions = function() {
  return ROLE_PERMISSIONS[this.role] || {};
};

UserSchema.methods.verifyPassword = function(password) {
  return bcrypt.compare(password, this.passwordHash);
};

UserSchema.statics.createUser = async function(username, password, role = 'user') {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  const u = new this({ username, passwordHash: hash, role });
  return u.save();
};

const User = mongoose.model('User', UserSchema);

// Export du modèle et des constantes
module.exports = User;
module.exports.ROLES = ROLES;
module.exports.ROLE_PERMISSIONS = ROLE_PERMISSIONS;
