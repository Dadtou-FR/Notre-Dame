// modules/paiements/paiements.routes.js

const express = require('express');
const router = express.Router();
const paiementsController = require('./paiements.controller');
const { requirePaymentAuth, checkPaymentAuth } = require('../middleware/auth');

// Routes publiques (login)
router.get('/login', checkPaymentAuth, paiementsController.showLogin);
router.post('/login', paiementsController.login);
router.get('/logout', paiementsController.logout);
router.post('/logout', paiementsController.logout);

// Routes protégées (nécessitent authentification)
// Liste des paiements
router.get('/', requirePaymentAuth, paiementsController.listPaiements);

// Ajouter un paiement
router.post('/add', requirePaymentAuth, paiementsController.create);

// Recherche d'étudiants (AJAX)
router.get('/search-etudiants', requirePaymentAuth, paiementsController.searchEtudiants);

// Statistiques
router.get('/statistiques', requirePaymentAuth, paiementsController.getStatistiques);

// Récupérer un paiement spécifique
router.get('/payment', requirePaymentAuth, paiementsController.getPayment);

// Paiements journaliers
router.get('/daily/:date', requirePaymentAuth, paiementsController.getDailyPaiements);
router.get('/daily/:date/pdf', requirePaymentAuth, paiementsController.genererDailyPDF);

// Détails des paiements d'un étudiant
router.get('/etudiant/:matricule', requirePaymentAuth, paiementsController.getPaiementsEtudiant);

// Générer un reçu
router.get('/recu/:matricule', requirePaymentAuth, paiementsController.genererRecu);

// Modifier un paiement
router.get('/:id/edit', requirePaymentAuth, paiementsController.showEditForm);
router.post('/:id/edit', requirePaymentAuth, paiementsController.updatePaiement);

// Supprimer un paiement
router.post('/:id/delete', requirePaymentAuth, paiementsController.deletePaiement);

module.exports = router;