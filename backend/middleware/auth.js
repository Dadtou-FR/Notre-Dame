// Middleware d'authentification pour les paiements
const PAYMENT_PASSWORD = process.env.PAYMENT_PASSWORD || 'admin123'; // Mot de passe par défaut

// Middleware pour vérifier l'authentification des paiements
exports.requirePaymentAuth = (req, res, next) => {
  // Si l'utilisateur est déjà passé par le login paiements
  if (req.session && req.session.paymentAuthenticated) {
    return next();
  }
  
  // Si l'utilisateur est connecté ET a la permission de gérer les paiements (admin, caissière)
  if (req.session && req.session.user && req.session.user.authenticated &&
      req.session.user.permissions && req.session.user.permissions.canManagePaiements) {
    return next();
  }
  
  // Sinon rediriger vers la page de connexion des paiements
  res.redirect('/paiements/login');
};

// Middleware pour vérifier si l'utilisateur est déjà connecté
exports.checkPaymentAuth = (req, res, next) => {
  if (req.session && req.session.paymentAuthenticated) {
    return res.redirect('/paiements');
  }
  next();
};

// Fonction pour vérifier le mot de passe
exports.verifyPassword = (password) => {
  return password === PAYMENT_PASSWORD;
};

// Fonction pour déconnecter l'utilisateur des paiements
exports.logoutPayment = (req, res) => {
  req.session.paymentAuthenticated = false;
  req.session.destroy((err) => {
    if (err) {
      console.error('Erreur lors de la déconnexion:', err);
    }
    res.redirect('/paiements/login');
  });
};

// ----- Authentification générale (application) -----
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Middleware pour protéger l'application (sauf routes publiques)
exports.requireLogin = (req, res, next) => {
  // Listes des chemins publics qui n'exigent pas d'authentification
  const publicPaths = [
    '/login',
    '/login/process',
    '/logout',
    '/assets',
    '/css',
    '/js',
    '/socket.io',
    '/paiements/login',
    '/paiements/login/process',
    '/paiements/daily/',
    '/paiements/recu/'
  ];

  // Autoriser les fichiers statiques et les routes publiques (prefix match)
  const path = req.path || '';
  if (publicPaths.some(p => path === p || path.startsWith(p + '/') || path.startsWith(p))) {
    return next();
  }

  if (req.session && req.session.user && req.session.user.authenticated) {
    return next();
  }

  // Rediriger vers la page de connexion
  res.redirect('/login');
};

// Middleware pour rediriger un utilisateur déjà connecté loin de la page de login
exports.checkLogin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.authenticated) {
    return res.redirect('/');
  }
  next();
};

// Vérifier les identifiants administrateur
exports.verifyUser = (username, password) => {
  return username === ADMIN_USER && password === ADMIN_PASSWORD;
};

// Déconnecter l'utilisateur général
exports.logout = (req, res) => {
  if (req.session) {
    req.session.user = null;
    req.session.destroy(err => {
      if (err) console.warn('Erreur destruction session:', err);
      res.redirect('/login');
    });
  } else {
    res.redirect('/login');
  }
};

// ----- Contrôle d'accès par rôle -----

// Rôles disponibles
exports.ROLES = {
  ADMIN: 'admin',
  SECRETAIRE: 'secretaire',
  CAISSIERE: 'caissiere',
  ENSEIGNANT: 'enseignant'
};

// Middleware pour vérifier un rôle spécifique
exports.requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.session || !req.session.user || !req.session.user.authenticated) {
      req.flash('error', 'Veuillez vous connecter pour accéder à cette page');
      return res.redirect('/login');
    }

    const userRole = req.session.user.role;
    
    if (!allowedRoles.includes(userRole)) {
      req.flash('error', 'Vous n\'avez pas l\'autorisation d\'accéder à cette page');
      return res.redirect('/');
    }

    next();
  };
};

// Middleware pour vérifier une permission spécifique
exports.requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.session || !req.session.user || !req.session.user.authenticated) {
      req.flash('error', 'Veuillez vous connecter pour accéder à cette page');
      return res.redirect('/login');
    }

    const permissions = req.session.user.permissions || {};
    
    if (!permissions[permission]) {
      req.flash('error', 'Vous n\'avez pas l\'autorisation d\'effectuer cette action');
      return res.redirect('/');
    }

    next();
  };
};

// Helper pour passer les permissions à toutes les vues
exports.attachUserPermissions = (req, res, next) => {
  if (req.session && req.session.user) {
    // Les permissions sont déjà stockées dans la session lors de la connexion
    res.locals.user = req.session.user;
    res.locals.canManageUsers = req.session.user.permissions?.canManageUsers || false;
    res.locals.canManageEtudiants = req.session.user.permissions?.canManageEtudiants || false;
    res.locals.canManageEnseignants = req.session.user.permissions?.canManageEnseignants || false;
    res.locals.canManagePaiements = req.session.user.permissions?.canManagePaiements || false;
    res.locals.canManageNotes = req.session.user.permissions?.canManageNotes || false;
    res.locals.canViewNotes = req.session.user.permissions?.canViewNotes || false;
    res.locals.canManageAnnees = req.session.user.permissions?.canManageAnnees || false;
    res.locals.canViewStats = req.session.user.permissions?.canViewStats || false;
    res.locals.canGenerateCertificats = req.session.user.permissions?.canGenerateCertificats || false;
    res.locals.canGenerateBulletins = req.session.user.permissions?.canGenerateBulletins || false;
  }
  next();
};




