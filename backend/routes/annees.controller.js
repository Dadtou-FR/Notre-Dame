const Annee = require('../models/annees');

exports.list = async (req, res) => {
  const annees = await Annee.find().sort({ date_debut: -1 }).lean();
  res.json({ success: true, annees });
};

exports.create = async (req, res) => {
  const { annee_label, date_debut, date_fin, est_active } = req.body;
  const isHtmlForm = (req.headers['content-type'] || '').includes('application/x-www-form-urlencoded')
    || (req.headers.accept || '').includes('text/html');
  try {
    const annee = await Annee.create({ annee_label, date_debut, date_fin, est_active: !!est_active });
    if (annee.est_active) {
      await Annee.setActive(annee._id);
    }
    if (isHtmlForm) {
      try { req.flash && req.flash('success', 'Année créée avec succès'); } catch (e) {}
      return res.redirect('/annees');
    }
    return res.json({ success: true, annee });
  } catch (error) {
    // Gestion du doublon sur annee_label
    if (error && error.code === 11000) {
      try {
        // Option 1: activer l'année existante si demandé
        const existante = await Annee.findOne({ annee_label }).lean();
        if (existante && est_active) {
          await Annee.setActive(existante._id);
        }
        if (isHtmlForm) {
          const msg = existante ? `L'année ${annee_label} existe déjà` : 'Année déjà existante';
          try { req.flash && req.flash('error', msg); } catch (e) {}
          return res.redirect('/annees');
        }
        return res.status(409).json({ success: false, message: 'Année déjà existante', annee: existante });
      } catch (e2) {
        if (isHtmlForm) {
          try { req.flash && req.flash('error', 'Erreur lors du traitement du doublon'); } catch (e) {}
          return res.redirect('/annees');
        }
        return res.status(500).json({ success: false, message: 'Erreur doublon' });
      }
    }
    // Autres erreurs
    if (isHtmlForm) {
      try { req.flash && req.flash('error', 'Erreur lors de la création'); } catch (e) {}
      return res.redirect('/annees');
    }
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.setActive = async (req, res) => {
  const { id } = req.params;
  const active = await Annee.setActive(id);
  const isHtmlForm = (req.headers['content-type'] || '').includes('application/x-www-form-urlencoded')
    || (req.headers.accept || '').includes('text/html');
  if (isHtmlForm) {
    try { req.flash && req.flash('success', 'Année activée'); } catch (e) {}
    return res.redirect('/annees');
  }
  res.json({ success: true, annee: active });
};

exports.getActive = async (req, res) => {
  const active = await Annee.getActive();
  res.json({ success: true, annee: active });
};

exports.getArchives = async (req, res) => {
  const archives = await Annee.getArchives();
  res.json({ success: true, archives });
};


