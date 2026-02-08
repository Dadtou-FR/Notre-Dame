const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    // Utiliser MongoDB local comme défaut si pas défini dans .env
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/Gestion_scolaire';

    // Supprimez complètement useNewUrlParser et useUnifiedTopology
    const conn = await mongoose.connect(mongoUri);

    console.log(`✅ MongoDB connecté: ${conn.connection.host}`);
    console.log(`📊 Base de données: ${conn.connection.name}`);

    return conn;
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = { connectDB, mongoose };