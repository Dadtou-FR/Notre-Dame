// scripts/init-paiements.js
// Script pour initialiser la base de données avec la structure de paiements mensuels

require('dotenv').config();
const mongoose = require('mongoose');

async function initPaiements() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gestion_ecole');
    console.log('✅ Connecté à MongoDB');
    
    const db = mongoose.connection.db;
    
    // 1. Créer la collection paiements avec validation
    console.log('\n📋 Création de la collection paiements...');
    
    try {
      await db.createCollection('paiements', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['numero_matricule', 'type_paiement', 'mois', 'annee', 'montant', 'date_paiement'],
            properties: {
              numero_matricule: {
                bsonType: 'string',
                description: 'Matricule de l\'étudiant - requis'
              },
              type_paiement: {
                bsonType: 'string',
                enum: ['Droit', 'Scolarité', 'Cantine', 'Transport', 'Fournitures', 'Activités'],
                description: 'Type de paiement - requis'
              },
              mois: {
                bsonType: 'string',
                enum: ['Droit', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
                description: 'Mois du paiement - requis'
              },
              annee: {
                bsonType: 'int',
                minimum: 2020,
                maximum: 2100,
                description: 'Année du paiement - requis'
              },
              montant: {
                bsonType: 'number',
                minimum: 0,
                description: 'Montant du paiement - requis'
              },
              date_paiement: {
                bsonType: 'date',
                description: 'Date du paiement - requis'
              },
              methode_paiement: {
                bsonType: 'string',
                enum: ['Espèces', 'Chèque', 'Virement', 'Mobile Money'],
                description: 'Méthode de paiement'
              },
              statut: {
                bsonType: 'string',
                enum: ['Payé', 'En retard', 'Non payé'],
                description: 'Statut du paiement'
              }
            }
          }
        }
      });
      console.log('✅ Collection paiements créée avec validation');
    } catch (err) {
      if (err.code === 48) {
        console.log('⚠️  Collection paiements existe déjà');
      } else {
        throw err;
      }
    }
    
    // 2. Créer les index
    console.log('\n🔍 Création des index...');
    
    const paiements = db.collection('paiements');
    
    // Index unique pour éviter les doublons
    await paiements.createIndex(
      { numero_matricule: 1, mois: 1, annee: 1, type_paiement: 1 },
      { unique: true, name: 'unique_paiement' }
    );
    console.log('✅ Index unique créé (numero_matricule + mois + annee + type_paiement)');
    
    // Index pour recherche par matricule
    await paiements.createIndex({ numero_matricule: 1 }, { name: 'idx_matricule' });
    console.log('✅ Index créé (numero_matricule)');
    
    // Index pour tri par date
    await paiements.createIndex({ date_paiement: -1 }, { name: 'idx_date' });
    console.log('✅ Index créé (date_paiement)');
    
    // Index pour filtrage par statut
    await paiements.createIndex({ statut: 1 }, { name: 'idx_statut' });
    console.log('✅ Index créé (statut)');
    
    // Index pour filtrage par année
    await paiements.createIndex({ annee: 1 }, { name: 'idx_annee' });
    console.log('✅ Index créé (annee)');
    
    // 3. Afficher les index créés
    console.log('\n📊 Index de la collection paiements:');
    const indexes = await paiements.indexes();
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });
    
    // 4. Statistiques
    const count = await paiements.countDocuments();
    console.log(`\n📈 Nombre de paiements actuels: ${count}`);
    
    console.log('\n✅ Initialisation terminée avec succès !');
    console.log('\n💡 Vous pouvez maintenant:');
    console.log('   1. Démarrer le serveur: npm start');
    console.log('   2. Accéder aux paiements: http://localhost:3000/paiements');
    console.log('   3. Ajouter des paiements via l\'interface');
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Erreur lors de l\'initialisation:', error);
    process.exit(1);
  }
}

// Exécuter le script
initPaiements();