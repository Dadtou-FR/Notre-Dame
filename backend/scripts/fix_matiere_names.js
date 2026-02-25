/**
 * Script de migration pour corriger les noms de matières
 * - SVT (Sciences de la Vie et de la Terre) → SVT
 * - EPS (Éducation Physique et Sportive) → EPS
 */

const mongoose = require('mongoose');

// Connexion à MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gestionecole';

async function migrate() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    const Note = require('../models/notes');

    // Mapping des noms de matières à corriger
    const matiereMappings = {
      'SVT (Sciences de la Vie et de la Terre)': 'SVT',
      'EPS (Éducation Physique et Sportive)': 'EPS'
    };

    console.log('\n📝 Début de la migration des noms de matières...\n');

    for (const [oldName, newName] of Object.entries(matiereMappings)) {
      // Compter les notes avec l'ancien nom
      const count = await Note.countDocuments({ matiere: oldName });
      
      if (count > 0) {
        console.log(`🔄 Mise à jour de "${oldName}" → "${newName}" (${count} notes)`);
        
        // Mettre à jour les notes
        const result = await Note.updateMany(
          { matiere: oldName },
          { $set: { matiere: newName } }
        );
        
        console.log(`   ✅ ${result.modifiedCount} notes mises à jour\n`);
      } else {
        console.log(`⏭️  Aucune note trouvée pour "${oldName}"\n`);
      }
    }

    console.log('✅ Migration terminée avec succès!');
    
    // Afficher les statistiques
    const stats = await Note.aggregate([
      { $group: { _id: '$matiere', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('\n📊 Statistiques des matières après migration:');
    stats.forEach(s => {
      console.log(`   - ${s._id}: ${s.count} notes`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
    process.exit(0);
  }
}

// Exécuter la migration
migrate();
