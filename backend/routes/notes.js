const express = require('express');
const router = express.Router();
const controller = require('./notes.controller');

router.get('/', controller.getAll);
router.get('/add', controller.showAddForm);
router.post('/add-batch', controller.addBatch);
router.get('/edit/:id', controller.showEditForm);
router.post('/edit/:id', controller.update);
router.get('/delete/:id', controller.delete);

// Nouvelles routes pour la gestion par étudiant
router.get('/edit-student/:matricule/:session', controller.showEditStudentForm);
router.post('/edit-student/:matricule/:session', controller.updateStudent);
router.get('/delete-student/:matricule/:session', controller.deleteStudent);

// Route pour la recherche d'étudiants (autocomplétion)
router.get('/search-students', controller.searchStudents);

module.exports = router;
