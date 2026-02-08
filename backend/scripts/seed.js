require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { connectDB, mongoose } = require('../config/db');

const Etudiant = require('../models/etudiants');
const Enseignant = require('../models/enseignants');
const Paiement = require('../models/paiements');
const Note = require('../models/notes');

function normalizeClasse(input) {
  if (!input) return null;
  const map = {
    '6A': '6ème A', '6B': '6ème B',
    '5A': '5ème A', '5B': '5ème B',
    '4A': '4ème A', '4B': '4ème B',
    '3A': '3ème A', '3B': '3ème B',
    '2NA': '2nde A', '2NB': '2nde B',
    '1A': '1ère A', '1B': '1ère B',
    'TA': 'Terminale A', 'TB': 'Terminale B'
  };
  return map[input] || input;
}

async function seed() {
  try {
    await connectDB();
    console.log('Connexion MongoDB OK');

    // Vérifier si des données existent déjà
    const [nbEtudiants, nbEnseignants, nbPaiements] = await Promise.all([
      Etudiant.countDocuments({}),
      Enseignant.countDocuments({}),
      Paiement.countDocuments({})
    ]);

    if (nbEtudiants > 0 || nbEnseignants > 0 || nbPaiements > 0) {
      console.log('\n📊 Données existantes trouvées :');
      console.log(`   - ${nbEtudiants} étudiants`);
      console.log(`   - ${nbEnseignants} enseignants`);
      console.log(`   - ${nbPaiements} paiements`);
      console.log('\n✅ Base de données déjà initialisée - Aucune action nécessaire');
      console.log('Les données existantes sont préservées.');
    } else {
      console.log('\n🌱 Ajout de données d\'exemple...');

      // Créer un utilisateur admin
      const User = require('../models/users');
      const adminUser = await User.createUser('admin', 'admin123', 'admin');
      console.log('   ✅ Utilisateur admin créé (username: admin, password: admin123)');

      // Créer un étudiant d'exemple
      const etudiant = new Etudiant({
        numero_matricule: '2024001',
        nom: 'Dupont',
        prenom: 'Jean',
        date_naissance: new Date('2010-05-15'),
        lieu_naissance: 'Mahajanga',
        nom_pere: 'Dupont Père',
        nom_mere: 'Dupont Mère',
        telephone_parent: '0341234567',
        niveau: '6ème',
        classe: '6ème A'
      });
      await etudiant.save();
      console.log('   ✅ Étudiant d\'exemple créé (Matricule: 2024001)');

      // Créer quelques notes pour cet étudiant
      const notes = [
        { numero_matricule: '2024001', matiere: 'Mathématiques', note: 15, session: '1er', type_evaluation: 'Controle Continu', commentaire: 'Très bien' },
        { numero_matricule: '2024001', matiere: 'Français', note: 14, session: '1er', type_evaluation: 'Controle Continu', commentaire: 'Bon travail' },
        { numero_matricule: '2024001', matiere: 'Histoire', note: 16, session: '1er', type_evaluation: 'Examen', commentaire: 'Excellent' }
      ];
      await Note.insertMany(notes);
      console.log('   ✅ Notes d\'exemple ajoutées');

      // Créer un enseignant d'exemple
      const enseignant = new Enseignant({
        nom: 'Martin',
        prenom: 'Marie',
        matieres: ['Mathématiques', 'Physique'],
        telephone: '0347654321'
      });
      await enseignant.save();
      console.log('   ✅ Enseignant d\'exemple créé');

      // Créer un paiement d'exemple
      const paiement = new Paiement({
        numero_matricule: '2024001',
        montant: 50000,
        description: 'Frais de scolarité - 1er trimestre',
        date_paiement: new Date()
      });
      await paiement.save();
      console.log('   ✅ Paiement d\'exemple créé');

      console.log('\n🎉 Base de données initialisée avec des données d\'exemple !');
      console.log('\nVous pouvez maintenant :');
      console.log('   - Tester l\'authentification avec admin/admin123');
      console.log('   - Consulter l\'étudiant 2024001 et ses notes');
      console.log('   - Générer un bulletin PDF pour 2024001');
      console.log('   - Ajouter/modifier des données via l\'interface web');
    }

    await mongoose.connection.close();
    process.exit(0);
    
  } catch (err) {
    console.error('❌ Erreur seed:', err);
    process.exit(1);
  }
}

seed();