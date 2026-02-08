const User = require('./users.model');

exports.list = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    res.render('users', { title: 'Gestion des comptes', users });
  } catch (err) {
    console.error('Erreur list users:', err);
    res.status(500).send('Erreur serveur');
  }
};

exports.showCreateForm = (req, res) => {
  res.render('user_form', { title: 'Créer un compte', user: null, action: '/admin/users/create' });
};

exports.create = async (req, res) => {
  try {
    const { username, password, role } = req.body || {};
    if (!username || !password) {
      req.flash('error', 'Nom d\'utilisateur et mot de passe requis');
      return res.redirect('/admin/users');
    }
    const exists = await User.findOne({ username }).lean();
    if (exists) {
      req.flash('error', 'Nom d\'utilisateur déjà existant');
      return res.redirect('/admin/users');
    }
    await User.createUser(username, password, role || 'user');
    req.flash('success', 'Compte créé');
    res.redirect('/admin/users');
  } catch (err) {
    console.error('Erreur création user:', err);
    req.flash('error', 'Erreur création compte');
    res.redirect('/admin/users');
  }
};

exports.showEditForm = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) return res.redirect('/admin/users');
    res.render('user_form', { title: 'Modifier un compte', user, action: '/admin/users/' + user._id + '/edit' });
  } catch (err) {
    console.error('Erreur showEdit user:', err);
    res.redirect('/admin/users');
  }
};

exports.update = async (req, res) => {
  try {
    const { username, password, role } = req.body || {};
    const user = await User.findById(req.params.id);
    if (!user) {
      req.flash('error', 'Compte introuvable');
      return res.redirect('/admin/users');
    }
    user.username = username || user.username;
    user.role = role || user.role;
    if (password && password.trim() !== '') {
      await User.findByIdAndUpdate(user._id, { passwordHash: await (await require('bcryptjs').genSalt(10)).then(s => require('bcryptjs').hash(password, s)) });
    } else {
      await user.save();
    }
    req.flash('success', 'Compte mis à jour');
    res.redirect('/admin/users');
  } catch (err) {
    console.error('Erreur update user:', err);
    req.flash('error', 'Erreur mise à jour');
    res.redirect('/admin/users');
  }
};

exports.remove = async (req, res) => {
  try {
    const id = req.params.id;
    // Ne pas permettre la suppression de son propre compte actuellement connecté
    if (req.session && req.session.user && req.session.user.username) {
      const current = req.session.user.username;
      const u = await User.findById(id).lean();
      if (u && u.username === current) {
        req.flash('error', 'Vous ne pouvez pas supprimer le compte connecté');
        return res.redirect('/admin/users');
      }
    }
    await User.findByIdAndDelete(id);
    req.flash('success', 'Compte supprimé');
    res.redirect('/admin/users');
  } catch (err) {
    console.error('Erreur delete user:', err);
    req.flash('error', 'Erreur suppression');
    res.redirect('/admin/users');
  }
};
