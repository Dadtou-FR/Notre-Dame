// modules/about/about.routes.js

const express = require('express');
const router = express.Router();
const aboutController = require('./about.controller');

// Route pour afficher la page À propos
router.get('/', aboutController.showAbout);

module.exports = router;
