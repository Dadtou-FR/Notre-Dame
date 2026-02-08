const express = require('express');
const router = express.Router();
const {
  transitionAnneeScolaire,
  getArchivesAnnee,
  getAnneeArchives,
  genererBulletinArchive,
  genererBulletinArchivePDF
} = require('./transitions.controller');

// Route pour effectuer la transition d'année scolaire
router.post('/transition', transitionAnneeScolaire);

// Route pour obtenir les archives d'une année spécifique
router.get('/archives/:annee', getArchivesAnnee);

// Route pour obtenir toutes les années archivées
router.get('/archives', getAnneeArchives);

// Route pour générer un bulletin d'un étudiant archivé (JSON)
router.get('/bulletin/:annee/:matricule', genererBulletinArchive);

// Route pour générer le PDF du bulletin archivé
router.get('/bulletin-pdf/:annee/:matricule', genererBulletinArchivePDF);

module.exports = router;
