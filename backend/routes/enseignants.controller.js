const EnseignantModel = require("../models/enseignants");

// Liste des matières (partagée avec les notes)
const matieres = [
  'Catéchèse',
  'Philosophie / Initiation',
  'Malagasy',
  'Français',
  'Anglais',
  'Espagnol',
  'Histoire - Géographie',
  'Mathématiques',
  'Physique - Chimie',
  'SVT',
  'Informatique',
  'EPS'
];

// Liste des classes (partagée avec les étudiants)
const classes = [
  'PS I', 'PS II', 'MS I', 'MS II',
  '12 ème I', '12 ème II', '12 ème III', '12 ème IV', '12 ème V',
  '11 ème I', '11 ème II', '11 ème III', '11 ème IV', '11 ème V',
  '10 ème I', '10 ème II', '10 ème III', '10 ème IV', '10 ème V',
  '9 ème I', '9 ème II', '9 ème III', '9 ème IV', '9 ème V',
  '8 ème I', '8 ème II', '8 ème III', '8 ème IV', '8 ème V',
  '7 ème I', '7 ème II', '7 ème III', '7 ème IV', '7 ème V',
  '6 ème I', '6 ème II', '6 ème III', '6 ème IV', '6 ème V',
  '5 ème I', '5 ème II', '5 ème III', '5 ème IV', '5 ème V',
  '4 ème I', '4 ème II', '4 ème III', '4 ème IV', '4 ème V',
  '3 ème I', '3 ème II', '3 ème III', '3 ème IV', '3 ème V',
  '2nde I', '2nde II', '2nde III', '2nde IV', '2nde V',
  '1ère AI', '1ère AII', '1ère C', '1ère DI', '1ère DII',
  'Terminale AI', 'Terminale AII', 'Terminale C', 'Terminale DI', 'Terminale DII'
];

exports.getAll = async (req, res) => {
  const enseignants = await EnseignantModel.find({}).sort({ _id: 1 }).lean();
  res.render("enseignants", { enseignants });
};

exports.showAddForm = (req, res) => {
  res.render("enseignant_add", { matieres, classes });
};

exports.add = async (req, res) => {
  try {
    const { nom, prenom, matiere, classes, telephone, email, date_embauche } = req.body;
    const normalizeDigits = (s) => (s || '').toString().replace(/\D/g, '');
    if (telephone && normalizeDigits(telephone).length !== 10) {
      return res.status(400).render('enseignant_add', { errorMessage: 'Le numéro de téléphone doit contenir exactement 10 chiffres.' });
    }
    await EnseignantModel.create({
      nom,
      prenom,
      matiere,
      classes: Array.isArray(classes) ? classes : classes ? [classes] : [],
      telephone,
      email: email || null,
      date_embauche: date_embauche ? new Date(date_embauche) : null
    });
    res.redirect("/enseignants");
  } catch (error) {
    console.error('Erreur ajout enseignant:', error);
    res.status(500).render('error', { message: 'Erreur lors de l\'ajout de l\'enseignant', title: 'Erreur' });
  }
};

exports.delete = async (req, res) => {
  await EnseignantModel.findByIdAndDelete(req.params.id);
  res.redirect("/enseignants");
};

// Nouvelle méthode pour voir les détails d'un enseignant
exports.view = async (req, res) => {
  try {
    console.log('Tentative d\'accès à l\'enseignant ID:', req.params.id);
    const enseignant = await EnseignantModel.findById(req.params.id).lean();
    console.log('Enseignant trouvé:', enseignant ? 'Oui' : 'Non');
    
    if (!enseignant) {
      console.log('Enseignant non trouvé avec l\'ID:', req.params.id);
      return res.status(404).send('Enseignant non trouvé');
    }
    
    console.log('Rendu de la page enseignant_view pour:', enseignant.prenom, enseignant.nom);
    res.render("enseignant_view", { enseignant });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'enseignant:', error);
    res.status(500).send('Erreur serveur: ' + error.message);
  }
};

// Nouvelle méthode pour afficher le formulaire de modification
exports.showEditForm = async (req, res) => {
  try {
    const enseignant = await EnseignantModel.findById(req.params.id).lean();
    if (!enseignant) {
      return res.status(404).send('Enseignant non trouvé');
    }
    res.render("enseignant_edit", { enseignant, matieres, classes });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'enseignant:', error);
    res.status(500).send('Erreur serveur');
  }
};

// Nouvelle méthode pour mettre à jour un enseignant
exports.update = async (req, res) => {
  try {
    const { nom, prenom, matiere, classes, telephone, email, date_embauche } = req.body;
    const normalizeDigits = (s) => (s || '').toString().replace(/\D/g, '');
    if (telephone && normalizeDigits(telephone).length !== 10) {
      const enseignant = await EnseignantModel.findById(req.params.id).lean();
      if (enseignant) {
        enseignant.nom = nom;
        enseignant.prenom = prenom;
        enseignant.matiere = matiere;
        enseignant.classes = Array.isArray(classes) ? classes : classes ? [classes] : [];
        enseignant.telephone = telephone;
        enseignant.email = email;
      }
      return res.status(400).render('enseignant_edit', { enseignant, matieres, classes, errorMessage: 'Le numéro de téléphone doit contenir exactement 10 chiffres.' });
    }
    await EnseignantModel.findByIdAndUpdate(req.params.id, {
      nom,
      prenom,
      matiere,
      classes: Array.isArray(classes) ? classes : classes ? [classes] : [],
      telephone,
      email: email || null,
      date_embauche: date_embauche ? new Date(date_embauche) : null
    });
    res.redirect("/enseignants");
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'enseignant:', error);
    res.status(500).send('Erreur serveur');
  }
};
