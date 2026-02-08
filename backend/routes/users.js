const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/users');

// Liste des utilisateurs
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password').lean();
    res.render('admin/users', {
      title: 'Gestion des Utilisateurs',
      users
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).render('error', {
      message: 'Erreur lors de la récupération des utilisateurs',
      title: 'Erreur'
    });
  }
});

// Formulaire d'ajout d'utilisateur
router.get('/add', (req, res) => {
  res.render('admin/user_add', {
    title: 'Ajouter un Utilisateur'
  });
});

// Création d'utilisateur
router.post('/add', async (req, res) => {
  try {
    const { username, password, role, nom, prenom, email } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).render('admin/user_add', {
        title: 'Ajouter un Utilisateur',
        errorMessage: 'Nom d\'utilisateur et mot de passe requis',
        formData: req.body
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).render('admin/user_add', {
        title: 'Ajouter un Utilisateur',
        errorMessage: 'Ce nom d\'utilisateur existe déjà',
        formData: req.body
      });
    }

    // Hash du mot de passe
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Créer l'utilisateur
    const user = new User({
      username,
      password: hashedPassword,
      role: role || 'user',
      nom,
      prenom,
      email
    });

    await user.save();

    req.flash('success', 'Utilisateur créé avec succès');
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    res.status(500).render('admin/user_add', {
      title: 'Ajouter un Utilisateur',
      errorMessage: 'Erreur lors de la création de l\'utilisateur',
      formData: req.body
    });
  }
});

// Formulaire de modification d'utilisateur
router.get('/edit/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).render('error', {
        message: 'Utilisateur non trouvé',
        title: 'Erreur'
      });
    }

    res.render('admin/user_edit', {
      title: 'Modifier l\'Utilisateur',
      user
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).render('error', {
      message: 'Erreur lors de la récupération de l\'utilisateur',
      title: 'Erreur'
    });
  }
});

// Modification d'utilisateur
router.post('/edit/:id', async (req, res) => {
  try {
    const { username, role, nom, prenom, email, password } = req.body;

    const updateData = {
      username,
      role: role || 'user',
      nom,
      prenom,
      email
    };

    // Si un nouveau mot de passe est fourni
    if (password && password.trim()) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    await User.findByIdAndUpdate(req.params.id, updateData);

    req.flash('success', 'Utilisateur modifié avec succès');
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Erreur lors de la modification de l\'utilisateur:', error);
    res.status(500).render('admin/user_edit', {
      title: 'Modifier l\'Utilisateur',
      errorMessage: 'Erreur lors de la modification de l\'utilisateur',
      user: req.body
    });
  }
});

// Suppression d'utilisateur
router.get('/delete/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    req.flash('success', 'Utilisateur supprimé avec succès');
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    req.flash('error', 'Erreur lors de la suppression de l\'utilisateur');
    res.redirect('/admin/users');
  }
});

module.exports = router;
