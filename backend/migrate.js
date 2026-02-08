const mysql = require('mysql2/promise');
const mongoose = require('mongoose');
require('dotenv').config();

const { connectDB } = require('./config/db');

const Etudiant = require('./gestionecole/src/models/Etudiant');
const Enseignant = require('./gestionecole/src/models/Enseignant');
const Paiement = require('./gestionecole/src/models/Paiement');
const Note = require('./gestionecole/src/models/Note');
const AnneeScolaire = require('./gestionecole/src/models/AnneeScolaire');
const Transition = require('./gestionecole/src/models/Transition');
const User = require('./gestionecole/src/models/User');

async function migrate() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('Connected to MongoDB');

    // Connect to MySQL
    const mysqlConnection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'gestion_ecole'
    });
    console.log('Connected to MySQL');

    // Migrate etudiants
    const [etudiants] = await mysqlConnection.execute('SELECT * FROM etudiants');
    for (const row of etudiants) {
      const etudiant = new Etudiant(row);
      await etudiant.save();
    }
    console.log(`Migrated ${etudiants.length} etudiants`);

    // Migrate enseignants
    const [enseignants] = await mysqlConnection.execute('SELECT * FROM enseignants');
    for (const row of enseignants) {
      const enseignant = new Enseignant(row);
      await enseignant.save();
    }
    console.log(`Migrated ${enseignants.length} enseignants`);

    // Migrate paiements
    const [paiements] = await mysqlConnection.execute('SELECT * FROM paiements');
    for (const row of paiements) {
      const paiement = new Paiement(row);
      await paiement.save();
    }
    console.log(`Migrated ${paiements.length} paiements`);

    // Migrate notes
    const [notes] = await mysqlConnection.execute('SELECT * FROM notes');
    for (const row of notes) {
      const note = new Note(row);
      await note.save();
    }
    console.log(`Migrated ${notes.length} notes`);

    // Migrate annees_scolaires
    const [annees] = await mysqlConnection.execute('SELECT * FROM annees_scolaires');
    for (const row of annees) {
      const annee = new AnneeScolaire(row);
      await annee.save();
    }
    console.log(`Migrated ${annees.length} annees_scolaires`);

    // Migrate transitions
    const [transitions] = await mysqlConnection.execute('SELECT * FROM transitions');
    for (const row of transitions) {
      const transition = new Transition(row);
      await transition.save();
    }
    console.log(`Migrated ${transitions.length} transitions`);

    // Migrate users
    const [users] = await mysqlConnection.execute('SELECT * FROM users');
    for (const row of users) {
      const user = new User(row);
      await user.save();
    }
    console.log(`Migrated ${users.length} users`);

    // Close connections
    await mysqlConnection.end();
    await mongoose.connection.close();
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
  }
}

migrate();
