const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/users');
const { ROLES } = require('../models/users');

// Configuration de la connexion MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/Gestion_scolaire';

const seedUsers = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Liste des utilisateurs à créer
    const usersToCreate = [
      {
        username: 'admin',
        password: 'admin123',
        role: ROLES.ADMIN,
        nom: 'RANDRIANARISOA',
        prenom: 'Jean Marie',
        email: 'admin@ecole.notredame.mg'
      },
      {
        username: 'secretaire',
        password: 'secret123',
        role: ROLES.SECRETAIRE,
        nom: 'RAKOTONDRAFARA',
        prenom: 'Bernadette',
        email: 'secretaire@ecole.notredame.mg'
      },
      {
        username: 'caissiere',
        password: 'caisse123',
        role: ROLES.CAISSIERE,
        nom: 'RABE',
        prenom: 'Marie',
        email: 'caissiere@ecole.notredame.mg'
      },
      {
        username: 'enseignant',
        password: 'prof123',
        role: ROLES.ENSEIGNANT,
        nom: 'RASOLOFO',
        prenom: 'Paul',
        email: 'prof@ecole.notredame.mg'
      }
    ];

    // Supprimer les utilisateurs existants et les recréer
    await User.deleteMany({});
    console.log('🗑️  Anciens utilisateurs supprimés');

    // Créer chaque utilisateur
    for (const userData of usersToCreate) {
      const user = await User.createUser(userData.username, userData.password, userData.role);
      
      // Mettre à jour les champs supplémentaires
      await User.findByIdAndUpdate(user._id, {
        nom: userData.nom,
        prenom: userData.prenom,
        email: userData.email,
        active: true
      });

      console.log(`✅ Utilisateur créé: ${userData.username} (${userData.role})`);
    }

    console.log('\n📋 Liste des utilisateurs créés:');
    console.log('┌─────────────┬────────────┬──────────────────────────────┐');
    console.log('│ Nom         │ Rôle       │ Mot de passe                 │');
    console.log('├─────────────┼────────────┼──────────────────────────────┤');
    console.log('│ admin       │ Administrateur │ admin123                  │');
    console.log('│ secretaire  │ Secrétaire  │ secret123                   │');
    console.log('│ caissiere   │ Caissière   │ caise123                    │');
    console.log('│ enseignant  │ Enseignant  │ prof123                     │');
    console.log('└─────────────┴────────────┴──────────────────────────────┘');

    console.log('\n🎉.seed terminé avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
    process.exit(0);
  }
};

// Exécuter le seed
seedUsers();
