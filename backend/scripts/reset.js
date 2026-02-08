require('dotenv').config();
const { connectDB, mongoose } = require('../config/db');

const Etudiant = require('../modules/etudiants/etudiants.model');
const Enseignant = require('../modules/enseignants/enseignants.model');
const Paiement = require('../models/paiements');
const Note = require('../models/notes');
const Document = require('../modules/documents/documents.model');

async function reset() {
  try {
    await connectDB();
    console.log('Connexion MongoDB OK');

    // Confirmer avant de vider
    console.log('\n⚠️  ATTENTION: Cette action va supprimer TOUTES les données !');
    console.log('Appuyez sur Ctrl+C pour annuler, ou attendez 5 secondes...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Vider toutes les collections
    const [etudiants, enseignants, paiements, notes, documents] = await Promise.all([
      Etudiant.deleteMany({}),
      Enseignant.deleteMany({}),
      Paiement.deleteMany({}),
      Note.deleteMany({}),
      Document.deleteMany({})
    ]);

    console.log('\n🗑️  Collections vidées :');
    console.log(`   - ${etudiants.deletedCount} étudiants supprimés`);
    console.log(`   - ${enseignants.deletedCount} enseignants supprimés`);
    console.log(`   - ${paiements.deletedCount} paiements supprimés`);
    console.log(`   - ${notes.deletedCount} notes supprimées`);
    console.log(`   - ${documents.deletedCount} documents supprimés`);

    console.log('\n✅ Base de données réinitialisée avec succès !');

    await mongoose.connection.close();
    process.exit(0);
    
  } catch (err) {
    console.error('❌ Erreur reset:', err);
    process.exit(1);
  }
}

reset();





