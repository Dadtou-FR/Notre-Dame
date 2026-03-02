const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { ROLES, ROLE_PERMISSIONS } = require('../models/users');

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
    console.log('🔍 Utilisateur trouvé:', user ? user.username : 'null');
    
    if (user) {
      const ok = await user.verifyPassword(password);
      console.log('🔍 Mot de passe vérifié:', ok);
      console.log('🔍 Rôle de l\'utilisateur:', user.role);
      
      if (ok) {
        // Utiliser directement ROLE_PERMISSIONS[user.role] pour être sûr
        const permissions = ROLE_PERMISSIONS[user.role] || {};
        console.log('🔍 Permissions:', JSON.stringify(permissions));
        
        req.session.user = { 
          username: user.username, 
          authenticated: true, 
          role: user.role,
          permissions: permissions,
          nom: user.nom,
          prenom: user.prenom
        };
        console.log('🔍 Session utilisateur:', JSON.stringify(req.session.user));
        
        req.flash('success', 'Connexion réussie - ' + user.role);
        return res.redirect('/');
      }
    } else {
      console.log('🔍 Aucun utilisateur trouvé avec ce username');
    }

    // Fallback: vérifier les variables d'environnement (si aucun user en base)
    if (auth.verifyUser && auth.verifyUser(username, password)) {
      console.log('🔍 Connexion via fallback (variables d\'env)');
      // Utiliser les permissions admin par défaut
      const permissions = ROLE_PERMISSIONS[ROLES.ADMIN] || {};
      req.session.user = { 
        username, 
        authenticated: true, 
        role: 'admin',
        permissions: permissions
      };
      req.flash('success', 'Connexion réussie - admin (fallback)');
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
