const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Page de login
router.get('/login', auth.checkLogin, (req, res) => {
  res.render('login', { title: 'Connexion' });
});

// Traitement du login (vérifie d'abord la collection Users puis fallback sur variables d'env)
router.post('/login/process', auth.checkLogin, async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    req.flash('error', 'Nom d\'utilisateur et mot de passe requis');
    return res.redirect('/login');
  }
  try {
    const User = require('../models/users');
    const user = await User.findOne({ username });
    if (user) {
      const ok = await user.verifyPassword(password);
      if (ok) {
        req.session.user = { username: user.username, authenticated: true, role: user.role };
        req.flash('success', 'Connexion réussie');
        return res.redirect('/');
      }
    }

    // Fallback: vérifier les variables d'environnement (si aucun user en base)
    if (auth.verifyUser && auth.verifyUser(username, password)) {
      req.session.user = { username, authenticated: true, role: 'admin' };
      req.flash('success', 'Connexion réussie');
      return res.redirect('/');
    }

    req.flash('error', 'Identifiants invalides');
    res.redirect('/login');
  } catch (err) {
    console.error('Erreur login:', err);
    req.flash('error', 'Erreur lors de la connexion');
    res.redirect('/login');
  }
});

// Déconnexion
router.get('/logout', (req, res) => {
  auth.logout(req, res);
});

module.exports = router;
