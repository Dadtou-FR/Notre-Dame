#!/usr/bin/env node
/**
 * Surveillance des changements sur la collection `etudiants`.
 * Utilise Change Streams si disponible (nécessite replica set). Sinon, effectue un polling toutes les X secondes.
 * Logs écrits dans logs/watch_etudiants.log
 */
const fs = require('fs');
const path = require('path');
const { connectDB, mongoose } = require('../config/db');
const Etudiant = require('../modules/etudiants/etudiants.model');

const LOG_DIR = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR);
const LOG_FILE = path.join(LOG_DIR, 'watch_etudiants.log');

function log(...args) {
  const line = new Date().toISOString() + ' - ' + args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

async function main() {
  await connectDB();
  const db = mongoose.connection.db;
  const coll = db.collection('etudiants');

  // Essayer d'utiliser Change Stream
  let changeStreamSupported = true;
  try {
    const stream = coll.watch();
    log('ChangeStream actif. Surveillance en temps réel démarrée.');
    stream.on('change', change => {
      log('CHANGE', change.operationType, change.fullDocument ? change.fullDocument.numero_matricule : change.documentKey);
      // Si niveau ressemble à une classe, logger plus de détails
      if (change.fullDocument && change.fullDocument.niveau) {
        const classes = ['PS','MS','GS','CP','CE1','CE2','CM1','CM2','6ème','5ème','4ème','3ème','2nde','1ère','Tle'];
        if (classes.includes(change.fullDocument.niveau)) {
          log('WARNING: document with class-like niveau detected', { id: change.documentKey, niveau: change.fullDocument.niveau });
        }
      }
    });
    stream.on('error', err => {
      log('ChangeStream error, fallback to polling:', err.message || err);
      stream.close();
      changeStreamSupported = false;
      startPolling();
    });
  } catch (e) {
    changeStreamSupported = false;
    log('ChangeStream non disponible (probablement pas de replica set). Fallback to polling.');
    startPolling();
  }

  function startPolling() {
    let lastCheck = new Date();
    setInterval(async () => {
      try {
        const docs = await Etudiant.find({ updatedAt: { $gte: lastCheck } }).lean();
        if (docs.length > 0) {
          for (const d of docs) {
            log('POLL_CHANGE', { id: d._id, numero_matricule: d.numero_matricule, niveau: d.niveau });
            const classes = ['PS','MS','GS','CP','CE1','CE2','CM1','CM2','6ème','5ème','4ème','3ème','2nde','1ère','Tle'];
            if (classes.includes(d.niveau)) {
              log('WARNING: polled document with class-like niveau', { id: d._id, niveau: d.niveau });
            }
          }
        }
        lastCheck = new Date();
      } catch (err) {
        log('Polling error:', err.message || err);
      }
    }, 5000); // every 5s
  }
}

main().catch(err => {
  console.error('Erreur watch script:', err);
  process.exit(1);
});
