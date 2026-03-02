const express = require('express');
const router = express.Router();
const controller = require('../modules/notes/notes.controller');
const auth = require('../middleware/auth');

// liste et consultation accessibles si l'utilisateur peut voir ou gérer les notes
router.get('/', auth.requirePermission('canViewNotes'), controller.getAll);

// opérations de modification strictement réservées à la gestion
router.get('/add', auth.requirePermission('canManageNotes'), controller.showAddForm);
router.post('/add-batch', auth.requirePermission('canManageNotes'), controller.addBatch);
router.get('/edit/:id', auth.requirePermission('canManageNotes'), controller.showEditForm);
router.post('/edit/:id', auth.requirePermission('canManageNotes'), controller.update);
router.get('/delete/:id', auth.requirePermission('canManageNotes'), controller.delete);

// Nouvelles routes pour la gestion par étudiant
router.get('/edit-student/:matricule/:session', auth.requirePermission('canManageNotes'), controller.showEditStudentForm);
router.post('/edit-student/:matricule/:session', auth.requirePermission('canManageNotes'), controller.updateStudent);
router.get('/delete-student/:matricule/:session', auth.requirePermission('canManageNotes'), controller.deleteStudent);

// Route pour la recherche d'étudiants (autocomplétion) - accessible à ceux qui voient les notes
router.get('/search-students', auth.requirePermission('canViewNotes'), controller.searchStudents);

module.exports = router;
