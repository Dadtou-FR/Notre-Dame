const express = require('express');
const router = express.Router();
const controller = require('./users.controller');

// Liste des comptes
router.get('/', controller.list);

// Créer
router.get('/create', controller.showCreateForm);
router.post('/create', controller.create);

// Modifier
router.get('/:id/edit', controller.showEditForm);
router.post('/:id/edit', controller.update);

// Supprimer
router.post('/:id/delete', controller.remove);

module.exports = router;
