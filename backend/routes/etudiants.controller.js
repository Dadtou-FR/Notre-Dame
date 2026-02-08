const Etudiant = require('../models/etudiants');
const Annee = require('../models/annees');

exports.create = async (req, res, next) => {
  try {
    const active = await Annee.getActive();
    if (active) {
      req.body.annee_scolaire = active.annee_label;
    }

    const normalizeDigits = (s) => (s || '').toString().replace(/\D/g, '');
    if (req.body.telephone_parent) {
      const digits = normalizeDigits(req.body.telephone_parent);
      if (digits.length !== 10) {
        return res.status(400).render('etudiant_add', {
          errorMessage: 'Le numéro de téléphone doit contenir exactement 10 chiffres.',
          formData: req.body
        });
      }
    }

    // Normalize incoming form data: checkboxes send "on" when checked
    const {
      numero_matricule, nom, prenom, niveau, classe, telephone_parent, est_vaccine,
      date_naissance, lieu_naissance, nom_pere, nom_mere, acte_numero, acte_date
    } = req.body || {};

    const etudiantData = {
      numero_matricule,
      nom,
      prenom,
      niveau,
      classe,
      telephone_parent,
      est_vaccine: est_vaccine === 'on',
      date_naissance: date_naissance || null,
      lieu_naissance: lieu_naissance || null,
      nom_pere: nom_pere || null,
      nom_mere: nom_mere || null,
      acte_numero: acte_numero || null,
      acte_date: acte_date || null,
      annee_scolaire: req.body.annee_scolaire || null
    };

    // Si `niveau` semble être une classe (ex: CM2), loguer pour diagnostic
    const classes = ['PS','MS','GS','CP','CE1','CE2','CM1','CM2','6ème','5ème','4ème','3ème','2nde','1ère','Tle'];
    if (niveau && classes.includes(niveau)) {
      console.warn(`WARNING: création étudiant reçu avec niveau='${niveau}' (classe). Matricule=${numero_matricule}`);
    }

    await Etudiant.create(etudiantData);
    res.redirect('/etudiants');
  } catch (e) {
    next(e);
  }
};

const EtudiantModel = require("../models/etudiants");

exports.getAll = async (req, res) => {
  try {
    const { classe, telephone_parent } = req.query;

    // Construire le filtre
    const filter = {};
    if (classe) {
      filter.classe = classe;
    }
    if (telephone_parent) {
      filter.telephone_parent = new RegExp(telephone_parent, 'i');
    }

    // Récupérer les étudiants filtrés
    const etudiants = await EtudiantModel.find(filter).sort({ _id: 1 }).lean();

    // Récupérer les classes uniques pour le select
    const classes = await EtudiantModel.distinct('classe').sort();

    res.render("etudiants", { etudiants, classes, filters: { classe, telephone_parent } });
  } catch (error) {
    console.error('Erreur lors de la récupération des étudiants:', error);
    res.status(500).render('error', {
      message: 'Erreur lors de la récupération des étudiants',
      title: 'Erreur'
    });
  }
};

exports.showAddForm = (req, res) => {
  res.render("etudiant_add");
};

exports.add = async (req, res) => {
  try {
    const { 
      numero_matricule, nom, prenom, niveau, classe, telephone_parent, est_vaccine,
      date_naissance, lieu_naissance, nom_pere, nom_mere, acte_numero, acte_date
    } = req.body;
    
    // Validation téléphone : 10 chiffres requis lorsque présent
    const normalizeDigits = (s) => (s || '').toString().replace(/\D/g, '');
    if (telephone_parent && normalizeDigits(telephone_parent).length !== 10) {
      return res.status(400).render('etudiant_add', { errorMessage: 'Le numéro de téléphone doit contenir exactement 10 chiffres.' });
    }

    // Log des données reçues pour débogage
    console.log('Données reçues:', {
      numero_matricule, nom, prenom, niveau, classe, telephone_parent, est_vaccine,
      date_naissance, lieu_naissance, nom_pere, nom_mere, acte_numero, acte_date
    });
    
    const etudiantData = {
      numero_matricule, nom, prenom, niveau, classe, telephone_parent, 
      est_vaccine: est_vaccine === 'on',
      date_naissance: date_naissance || null,
      lieu_naissance: lieu_naissance || null,
      nom_pere: nom_pere || null,
      nom_mere: nom_mere || null,
      acte_numero: acte_numero || null,
      acte_date: acte_date || null
    };
    
    console.log('Données à enregistrer:', etudiantData);
    const classes = ['PS','MS','GS','CP','CE1','CE2','CM1','CM2','6ème','5ème','4ème','3ème','2nde','1ère','Tle'];
    if (niveau && classes.includes(niveau)) {
      console.warn(`WARNING: ajout étudiant reçu avec niveau='${niveau}' (classe). Matricule=${numero_matricule}`);
    }

    await EtudiantModel.create(etudiantData);
    res.redirect("/etudiants");
  } catch (error) {
    console.error('Erreur lors de l\'ajout:', error);
    res.status(500).render('error', { 
      message: 'Erreur lors de l\'ajout de l\'étudiant',
      title: 'Erreur'
    });
  }
};

exports.showEditForm = async (req, res) => {
  const etudiant = await EtudiantModel.findById(req.params.id);
  res.render("etudiant_edit", { etudiant });
};

exports.update = async (req, res) => {
  try {
    const { 
      numero_matricule, nom, prenom, niveau, classe, telephone_parent, est_vaccine,
      date_naissance, lieu_naissance, nom_pere, nom_mere, acte_numero, acte_date
    } = req.body;
    
    // Validation téléphone : 10 chiffres requis lorsque présent
    const normalizeDigits = (s) => (s || '').toString().replace(/\D/g, '');
    if (telephone_parent && normalizeDigits(telephone_parent).length !== 10) {
      // Préparer l'objet étudiant pour réafficher les valeurs saisies dans le formulaire
      const etudiant = await EtudiantModel.findById(req.params.id).lean();
      if (etudiant) {
        etudiant.numero_matricule = numero_matricule;
        etudiant.nom = nom;
        etudiant.prenom = prenom;
        etudiant.niveau = niveau;
        etudiant.classe = classe;
        etudiant.telephone_parent = telephone_parent;
      }
      return res.status(400).render('etudiant_edit', { etudiant, errorMessage: 'Le numéro de téléphone doit contenir exactement 10 chiffres.' });
    }

    // Vérifier si le matricule existe déjà pour un autre étudiant
    const existingEtudiant = await EtudiantModel.findOne({ 
      numero_matricule, 
      _id: { $ne: req.params.id } 
    });
    
    if (existingEtudiant) {
      return res.status(400).render('error', { 
        message: `Le matricule ${numero_matricule} est déjà utilisé par un autre étudiant`,
        title: 'Erreur de modification'
      });
    }
    
    const etudiantData = {
      numero_matricule, nom, prenom, niveau, classe, telephone_parent, 
      est_vaccine: est_vaccine === 'on',
      date_naissance: date_naissance || null,
      lieu_naissance: lieu_naissance || null,
      nom_pere: nom_pere || null,
      nom_mere: nom_mere || null,
      acte_numero: acte_numero || null,
      acte_date: acte_date || null
    };
    const classes = ['PS','MS','GS','CP','CE1','CE2','CM1','CM2','6ème','5ème','4ème','3ème','2nde','1ère','Tle'];
    if (niveau && classes.includes(niveau)) {
      console.warn(`WARNING: modification étudiant reçu avec niveau='${niveau}' (classe). ID=${req.params.id} Matricule=${numero_matricule}`);
    }

    await EtudiantModel.findByIdAndUpdate(req.params.id, etudiantData);
    res.redirect("/etudiants");
  } catch (error) {
    console.error('Erreur lors de la modification:', error);
    res.status(500).render('error', { 
      message: 'Erreur lors de la modification de l\'étudiant',
      title: 'Erreur'
    });
  }
};

exports.delete = async (req, res) => {
  await EtudiantModel.findByIdAndDelete(req.params.id);
  res.redirect("/etudiants");
};

// Générer le prochain numéro de matricule
exports.getNextMatricule = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    
    // Trouver le plus haut numéro de matricule pour l'année courante
    const lastEtudiant = await EtudiantModel.findOne({
      numero_matricule: { $regex: `^${currentYear}-` }
    }).sort({ numero_matricule: -1 });
    
    let nextNumber = 1;
    
    if (lastEtudiant) {
      // Extraire le numéro du matricule existant
      const match = lastEtudiant.numero_matricule.match(/\d+$/);
      if (match) {
        nextNumber = parseInt(match[0]) + 1;
      }
    }
    
    // Formater le nouveau matricule
    const nextMatricule = `${currentYear}-${nextNumber.toString().padStart(4, '0')}`;
    
    res.json({
      success: true,
      matricule: nextMatricule
    });
    
  } catch (error) {
    console.error('Erreur génération matricule:', error);
    res.json({
      success: false,
      message: 'Erreur lors de la génération du matricule'
    });
  }
};
