const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/users');
const { ROLES } = require('../models/users');

// Liste des utilisateurs - avec contrôle d'accès
router.get('/', async (req, res) => {
  try {
    // Vérifier les permissions
    if (!req.session.user || !req.session.user.permissions || !req.session.user.permissions.canManageUsers) {
      req.flash('error', 'Vous n\'avez pas l\'autorisation de gérer les utilisateurs');
      return res.redirect('/');
    }
    
    const users = await User.find().select('-passwordHash').lean();
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

// Formulaire d'ajout d'utilisateur - avec contrôle d'accès
router.get('/add', (req, res) => {
  // Vérifier les permissions
  if (!req.session.user || !req.session.user.permissions || !req.session.user.permissions.canManageUsers) {
    req.flash('error', 'Vous n\'avez pas l\'autorisation de créer des utilisateurs');
    return res.redirect('/');
  }
  
  res.render('admin/user_add', {
    title: 'Ajouter un Utilisateur',
    formData: {}
  });
});

// Création d'utilisateur - avec contrôle d'accès
router.post('/add', async (req, res) => {
  try {
    // Vérifier les permissions
    if (!req.session.user || !req.session.user.permissions || !req.session.user.permissions.canManageUsers) {
      req.flash('error', 'Vous n\'avez pas l\'autorisation de créer des utilisateurs');
      return res.redirect('/');
    }

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

    // Vérifier que le rôle est valide
    const validRoles = Object.values(ROLES);
    if (!validRoles.includes(role)) {
      return res.status(400).render('admin/user_add', {
        title: 'Ajouter un Utilisateur',
        errorMessage: 'Rôle invalide',
        formData: req.body
      });
    }

    // Créer l'utilisateur avec la méthode du modèle
    const user = await User.createUser(username, password, role || ROLES.ENSEIGNANT);
    
    // Mettre à jour les champs supplémentaires
    await User.findByIdAndUpdate(user._id, {
      nom,
      prenom,
      email,
      active: true
    });

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

// Formulaire de modification d'utilisateur - avec contrôle d'accès
router.get('/edit/:id', async (req, res) => {
  try {
    // Vérifier les permissions
    if (!req.session.user || !req.session.user.permissions || !req.session.user.permissions.canManageUsers) {
      req.flash('error', 'Vous n\'avez pas l\'autorisation de modifier des utilisateurs');
      return res.redirect('/');
    }

    const user = await User.findById(req.params.id).select('-passwordHash');
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

// Modification d'utilisateur - avec contrôle d'accès
router.post('/edit/:id', async (req, res) => {
  try {
    // Vérifier les permissions
    if (!req.session.user || !req.session.user.permissions || !req.session.user.permissions.canManageUsers) {
      req.flash('error', 'Vous n\'avez pas l\'autorisation de modifier des utilisateurs');
      return res.redirect('/');
    }

    const { username, role, nom, prenom, email, password } = req.body;

    // Vérifier que le rôle est valide
    const validRoles = Object.values(ROLES);
    if (!validRoles.includes(role)) {
      return res.status(400).render('admin/user_edit', {
        title: 'Modifier l\'Utilisateur',
        errorMessage: 'Rôle invalide',
        user: req.body
      });
    }

    const updateData = {
      username,
      role,
      nom,
      prenom,
      email
    };

    // Si un nouveau mot de passe est fourni
    if (password && password.trim()) {
      const saltRounds = 10;
      updateData.passwordHash = await bcrypt.hash(password, saltRounds);
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

// Activer/Désactiver un utilisateur - avec contrôle d'accès
router.post('/toggle/:id', async (req, res) => {
  try {
    // Vérifier les permissions
    if (!req.session.user || !req.session.user.permissions || !req.session.user.permissions.canManageUsers) {
      req.flash('error', 'Vous n\'avez pas l\'autorisation de modifier des utilisateurs');
      return res.redirect('/');
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      req.flash('error', 'Utilisateur non trouvé');
      return res.redirect('/admin/users');
    }

    // Empêcher la désactivation de son propre compte
    if (user._id.toString() === req.session.user._id) {
      req.flash('error', 'Vous ne pouvez pas désactiver votre propre compte');
      return res.redirect('/admin/users');
    }

    user.active = !user.active;
    await user.save();

    req.flash('success', user.active ? 'Utilisateur activé' : 'Utilisateur désactivé');
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Erreur lors du changement de statut:', error);
    req.flash('error', 'Erreur lors du changement de statut');
    res.redirect('/admin/users');
  }
});

// Suppression d'utilisateur - avec contrôle d'accès
router.post('/delete/:id', async (req, res) => {
  try {
    // Vérifier les permissions
    if (!req.session.user || !req.session.user.permissions || !req.session.user.permissions.canManageUsers) {
      req.flash('error', 'Vous n\'avez pas l\'autorisation de supprimer des utilisateurs');
      return res.redirect('/');
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      req.flash('error', 'Utilisateur non trouvé');
      return res.redirect('/admin/users');
    }

    // Empêcher la suppression de son propre compte
    if (user._id.toString() === req.session.user._id) {
      req.flash('error', 'Vous ne pouvez pas supprimer votre propre compte');
      return res.redirect('/admin/users');
    }

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
