#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { connectDB, mongoose } = require('../config/db');
const Etudiant = require('../modules/etudiants/etudiants.model');

const classeToNiveau = {
  'PS': 'Maternelles', 'MS': 'Maternelles', 'GS': 'Maternelles',
  'CP': 'Primaires', 'CE1': 'Primaires', 'CE2': 'Primaires', 'CM1': 'Primaires', 'CM2': 'Primaires',
  '6ème': 'Premier cycle', '5ème': 'Premier cycle', '4ème': 'Premier cycle', '3ème': 'Premier cycle',
  '2nde': 'Second cycle', '1ère': 'Second cycle', 'Tle': 'Second cycle'
};

const LOG_PATH = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(LOG_PATH)) fs.mkdirSync(LOG_PATH);
const LOG_FILE = path.join(LOG_PATH, 'fix_etudiants_niveau.log');

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');

  await connectDB();

  // Trouver les étudiants dont `niveau` correspond à une classe (ex: 'CM2')
  const classes = Object.keys(classeToNiveau);
  const query = { niveau: { $in: classes } };

  const etudiants = await Etudiant.find(query).lean();

  if (!etudiants.length) {
    console.log('Aucun étudiant trouvé avec un niveau de type classe.');
    process.exit(0);
  }

  console.log(`Trouvé ${etudiants.length} étudiants à corriger. Dry-run=${!apply}`);

  const changes = [];

  for (const e of etudiants) {
    const old = e.niveau;
    const nouvelle = classeToNiveau[old] || old;
    changes.push({ id: e._id.toString(), numero_matricule: e.numero_matricule, ancien: old, nouveau: nouvelle });
    if (apply) {
      await Etudiant.updateOne({ _id: e._id }, { $set: { niveau: nouvelle } });
    }
  }

  // Log results
  const now = new Date().toISOString();
  const log = `${now} - DryRun=${!apply} - Tot=${changes.length}\n` + changes.map(c => JSON.stringify(c)).join('\n') + '\n\n';
  fs.appendFileSync(LOG_FILE, log);

  console.log('Opération terminée. Détails écrits dans', LOG_FILE);
  if (!apply) console.log('Pour appliquer les changements, relancer avec --apply');

  process.exit(0);
}

main().catch(err => {
  console.error('Erreur script:', err);
  process.exit(1);
});
