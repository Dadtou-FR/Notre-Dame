const express = require('express');
const router = express.Router();
const Annee = require('../models/annees');
const Etudiant = require('../models/etudiants');
const Note = require('../models/notes');
const Paiement = require('../models/paiements');

// Afficher la page de gestion des transitions
router.get('/', async (req, res) => {
  try {
    const annees = await Annee.find().sort({ date_debut: -1 }).lean();
    const active = await Annee.getActive();
    res.render('transitions', {
      title: 'Gestion des Années Scolaires',
      annees,
      active
    });
  } catch (error) {
    console.error('Erreur lors de l\'affichage des transitions:', error);
    res.status(500).render('error', {
      message: 'Erreur lors de l\'affichage des transitions',
      title: 'Erreur'
    });
  }
});

// API pour archiver l'année active
router.post('/archive', async (req, res) => {
  try {
    const active = await Annee.getActive();
    if (!active) {
      return res.status(400).json({ success: false, message: 'Aucune année active à archiver' });
    }

    // Archiver l'année
    await Annee.findByIdAndUpdate(active._id, { est_active: false });

    res.json({ success: true, message: 'Année archivée avec succès' });
  } catch (error) {
    console.error('Erreur lors de l\'archivage:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'archivage' });
  }
});

// API pour créer une nouvelle année
router.post('/create-year', async (req, res) => {
  try {
    const { annee_label, date_debut, date_fin } = req.body;

    if (!annee_label || !date_debut || !date_fin) {
      return res.status(400).json({ success: false, message: 'Données incomplètes' });
    }

    const annee = await Annee.create({
      annee_label,
      date_debut: new Date(date_debut),
      date_fin: new Date(date_fin),
      est_active: true
    });

    // Désactiver les autres années
    await Annee.updateMany({ _id: { $ne: annee._id } }, { est_active: false });

    res.json({ success: true, annee });
  } catch (error) {
    console.error('Erreur lors de la création de l\'année:', error);
    if (error.code === 11000) {
      res.status(409).json({ success: false, message: 'Cette année existe déjà' });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la création' });
    }
  }
});

// API pour promouvoir les étudiants
router.post('/promote-students', async (req, res) => {
  try {
    const { from_year, to_year } = req.body;

    if (!from_year || !to_year) {
      return res.status(400).json({ success: false, message: 'Années source et destination requises' });
    }

    // Récupérer les étudiants de l'année source
    const etudiants = await Etudiant.find({ annee_scolaire: from_year }).lean();

    let promoted = 0;
    let skipped = 0;

    for (const etudiant of etudiants) {
      // Logique de promotion simple (à adapter selon les besoins)
      const newClasse = getNextClasse(etudiant.classe);

      if (newClasse) {
        await Etudiant.findByIdAndUpdate(etudiant._id, {
          classe: newClasse,
          annee_scolaire: to_year
        });
        promoted++;
      } else {
        skipped++;
      }
    }

    res.json({
      success: true,
      message: `${promoted} étudiants promus, ${skipped} ignorés`,
      promoted,
      skipped
    });
  } catch (error) {
    console.error('Erreur lors de la promotion:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la promotion' });
  }
});

// Fonction utilitaire pour déterminer la classe suivante
function getNextClasse(currentClasse) {
  const progression = {
    'PS': 'MS',
    'MS': 'GS',
    'GS': 'CP',
    'CP': 'CE1',
    'CE1': 'CE2',
    'CE2': 'CM1',
    'CM1': 'CM2',
    'CM2': '6ème',
    '6ème': '5ème',
    '5ème': '4ème',
    '4ème': '3ème',
    '3ème': '2nde',
    '2nde': '1ère',
    '1ère': 'Tle'
  };

  return progression[currentClasse] || null;
}

// API pour transférer les données (notes, paiements) vers la nouvelle année
router.post('/transfer-data', async (req, res) => {
  try {
    const { from_year, to_year } = req.body;

    if (!from_year || !to_year) {
      return res.status(400).json({ success: false, message: 'Années source et destination requises' });
    }

    // Transférer les notes (optionnel, selon la politique de l'école)
    // const notesTransferred = await Note.updateMany(
    //   { annee_scolaire: from_year },
    //   { annee_scolaire: to_year }
    // );

    // Transférer les paiements (optionnel)
    // const paiementsTransferred = await Paiement.updateMany(
    //   { annee_scolaire: from_year },
    //   { annee_scolaire: to_year }
    // );

    res.json({
      success: true,
      message: 'Transfert des données terminé',
      // notesTransferred: notesTransferred.modifiedCount,
      // paiementsTransferred: paiementsTransferred.modifiedCount
    });
  } catch (error) {
    console.error('Erreur lors du transfert:', error);
    res.status(500).json({ success: false, message: 'Erreur lors du transfert' });
  }
});

module.exports = router;
