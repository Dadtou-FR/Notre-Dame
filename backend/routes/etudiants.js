const express = require('express');
const router = express.Router();
const controller = require('./etudiants.controller');

router.get('/', controller.getAll);
router.get('/add', controller.showAddForm);
router.post('/add', controller.create);
router.get('/edit/:id', controller.showEditForm);
router.post('/edit/:id', controller.update);
router.get('/delete/:id', controller.delete);

// API pour générer le prochain matricule
router.get('/api/next-matricule', controller.getNextMatricule);

module.exports = router;