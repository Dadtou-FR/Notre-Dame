// Middleware d'authentification pour les paiements
const PAYMENT_PASSWORD = process.env.PAYMENT_PASSWORD || 'admin123'; // Mot de passe par défaut

// Middleware pour vérifier l'authentification des paiements
exports.requirePaymentAuth = (req, res, next) => {
  // Vérifier si l'utilisateur est authentifié pour les paiements
  if (req.session && req.session.paymentAuthenticated) {
    return next();
  }
  
  // Rediriger vers la page de connexion des paiements
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
    '/paiements/login/process'
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



