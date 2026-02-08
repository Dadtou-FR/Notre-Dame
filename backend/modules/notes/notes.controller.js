const NoteModel = require("./notes.model");
const Etudiant = require('../etudiants/etudiants.model');

// Fonction helper pour calculer l'appréciation
function getAppreciation(note) {
  if (note >= 18) return 'Excellent';
  if (note >= 16) return 'Très bien';
  if (note >= 14) return 'Bien';
  if (note >= 12) return 'Assez bien';
  if (note >= 10) return 'Passable';
  if (note >= 8) return 'Insuffisant';
  if (note >= 6) return 'Très insuffisant';
  return 'Nul';
}

// Fonction helper pour la classe CSS de l'appréciation
function getAppreciationClass(note) {
  if (note >= 16) return 'bg-success';
  if (note >= 12) return 'bg-warning';
  if (note >= 10) return 'bg-info';
  return 'bg-danger';
}

const Annee = require('../annees/annees.model');

exports.getAll = async (req, res) => {
  const { matricule, session } = req.query || {};
  const { annee, type_evaluation } = req.query || {};
  let filter = {};
  
  if (matricule) {
    filter.numero_matricule = new RegExp(matricule, 'i');
  }
  
  if (session) {
    filter.session = session;
  }
  
  if (type_evaluation) {
    filter.type_evaluation = type_evaluation;
  }
  
  // restreindre à l'année active si aucune année n'est fournie
  const activeAnnee = await Annee.getActive();
  // si l'utilisateur demande explicitement toutes les années (annee=all), ne pas filtrer
  if (!(annee && annee.toLowerCase() === 'all')) {
    if (activeAnnee) {
      filter.annee_scolaire = activeAnnee.annee_label;
    }
  }

  const notes = await NoteModel.find(filter).sort({ createdAt: -1 }).lean();
  
  // Regrouper les notes par étudiant et session
  const etudiantsNotes = {};
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
  
  // Grouper par numero_matricule + session + type_evaluation pour afficher INT/Exam séparément
  notes.forEach(note => {
    const key = `${note.numero_matricule}_${note.session}_${note.type_evaluation}`;
    if (!etudiantsNotes[key]) {
      etudiantsNotes[key] = {
        numero_matricule: note.numero_matricule,
        session: note.session,
        type_evaluation: note.type_evaluation,
        notes: {},
        moyenne: 0,
        appreciation: ''
      };
    }
    etudiantsNotes[key].notes[note.matiere] = {
      note: note.note,
      commentaire: note.commentaire || ''
    };
  });
  
  // Calculer la moyenne et l'appréciation pour chaque étudiant
  Object.values(etudiantsNotes).forEach(etudiant => {
    const notesValues = Object.values(etudiant.notes).map(n => n.note);
    if (notesValues.length > 0) {
      etudiant.moyenne = (notesValues.reduce((sum, note) => sum + note, 0) / notesValues.length).toFixed(2);
      etudiant.appreciation = getAppreciation(parseFloat(etudiant.moyenne));
    }
  });
  
  res.render("notes", { 
    etudiantsNotes: Object.values(etudiantsNotes),
    matieres,
    query: { matricule: matricule || '', session: session || '', annee: annee || '', type_evaluation: type_evaluation || '' },
    getAppreciation,
    getAppreciationClass
  });
};

exports.showAddForm = (req, res) => {
  res.render("note_add");
};

exports.addBatch = async (req, res) => {
  const { numero_matricule, session, type_evaluation, notes } = req.body;
  
  try {
    // Vérifier que l'élève existe
    const Etudiant = require('../etudiants/etudiants.model');
    const etudiant = await Etudiant.findOne({ numero_matricule });
    
    if (!etudiant) {
      return res.status(400).send('Élève non trouvé avec ce numéro matricule');
    }
    
    // Traiter les notes saisies
    const notesToCreate = [];
    
    const activeAnnee = await Annee.getActive();
    const anneeLabel = activeAnnee ? activeAnnee.annee_label : null;

    for (const [matiere, data] of Object.entries(notes)) {
      if (data.note && data.note.trim() !== '') {
        const noteValue = parseFloat(data.note);
        
        // Validation de la note
        if (isNaN(noteValue) || noteValue < 0 || noteValue > 20) {
          return res.status(400).send(`Note invalide pour ${matiere}: ${data.note}`);
        }
        
        notesToCreate.push({
          numero_matricule,
          matiere,
          note: noteValue,
          session,
          type_evaluation: type_evaluation,
          commentaire: data.commentaire || '',
          annee_scolaire: anneeLabel
        });
      }
    }
    
    if (notesToCreate.length === 0) {
      return res.status(400).send('Aucune note valide saisie');
    }
    
    // Créer toutes les notes en une seule fois
    await NoteModel.insertMany(notesToCreate);
    
    res.redirect("/notes?success=batch_added");
    
  } catch (error) {
    console.error('Erreur lors de l\'ajout en lot:', error);
    res.status(500).send('Erreur lors de l\'enregistrement des notes');
  }
};

exports.showEditForm = async (req, res) => {
  const note = await NoteModel.findById(req.params.id);
  res.render("note_edit", { note });
};

exports.update = async (req, res) => {
  const { numero_matricule, matiere, note, session, type_evaluation, commentaire } = req.body;
  await NoteModel.findByIdAndUpdate(req.params.id, {
    numero_matricule,
    matiere,
    note: parseFloat(note),
    session,
    type_evaluation: type_evaluation,
    commentaire
  });
  res.redirect("/notes");
};

exports.delete = async (req, res) => {
  await NoteModel.findByIdAndDelete(req.params.id);
  res.redirect("/notes");
};

// Nouvelle fonction pour afficher le formulaire d'édition par étudiant
exports.showEditStudentForm = async (req, res) => {
  const { matricule, session } = req.params;
  // Permettre la sélection du type d'évaluation via query string ou par défaut
  const selectedType = req.query.type_evaluation || req.query.type || 'Controle Continu';

  // Récupérer toutes les notes de cet étudiant pour cette session ET pour le type sélectionné
  const activeAnnee = await Annee.getActive();
  const yearFilter = activeAnnee ? { annee_scolaire: activeAnnee.annee_label } : {};
  const notes = await NoteModel.find({ 
    numero_matricule: matricule, 
    session: session,
    type_evaluation: selectedType,
    ...yearFilter
  }).lean();
  
  // Organiser les notes par matière
  const notesByMatiere = {};
  notes.forEach(note => {
    notesByMatiere[note.matiere] = {
      note: note.note,
      commentaire: note.commentaire || ''
    };
  });
  
  res.render("note_edit_student", { 
    matricule, 
    session, 
    notesByMatiere,
    selectedType,
    matieres: [
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
    ]
  });
};

// Nouvelle fonction pour mettre à jour les notes d'un étudiant
exports.updateStudent = async (req, res) => {
  const { matricule, session } = req.params;
  const { notes, type_evaluation } = req.body;
  
  try {
    const activeAnnee = await Annee.getActive();
    const anneeLabel = activeAnnee ? activeAnnee.annee_label : null;
    // Supprimer uniquement les notes existantes pour cet étudiant, cette session ET le type d'évaluation sélectionné
    const typeToDelete = type_evaluation || 'Controle Continu';
    await NoteModel.deleteMany({ numero_matricule: matricule, session: session, type_evaluation: typeToDelete, ...(anneeLabel ? { annee_scolaire: anneeLabel } : {}) });
    
    // Créer les nouvelles notes
    const notesToCreate = [];
    
    for (const [matiere, data] of Object.entries(notes)) {
      if (data.note && data.note.trim() !== '') {
        const noteValue = parseFloat(data.note);
        
        if (!isNaN(noteValue) && noteValue >= 0 && noteValue <= 20) {
          notesToCreate.push({
            numero_matricule: matricule,
            matiere,
            note: noteValue,
            session: session,
            type_evaluation: type_evaluation || 'Controle Continu',
            commentaire: data.commentaire || '',
            annee_scolaire: anneeLabel
          });
        }
      }
    }
    
    if (notesToCreate.length > 0) {
      await NoteModel.insertMany(notesToCreate);
    }
    
    res.redirect("/notes?success=updated");
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    res.status(500).send('Erreur lors de la mise à jour des notes');
  }
};

// Nouvelle fonction pour supprimer toutes les notes d'un étudiant
exports.deleteStudent = async (req, res) => {
  const { matricule, session } = req.params;
  
  try {
    await NoteModel.deleteMany({ numero_matricule: matricule, session: session });
    res.redirect("/notes?success=deleted");
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    res.status(500).send('Erreur lors de la suppression des notes');
  }
};

// Fonction pour rechercher des étudiants par numéro matricule (pour autocomplétion)
exports.searchStudents = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.json([]);
    }
    
    // Rechercher les étudiants dont le numéro matricule, nom ou prénom contient la requête
    const etudiants = await Etudiant.find({
      $or: [
        { numero_matricule: new RegExp(q, 'i') },
        { nom: new RegExp(q, 'i') },
        { prenom: new RegExp(q, 'i') }
      ]
    }).select('numero_matricule nom prenom classe niveau').limit(10).lean();
    
    // Formater la réponse
    const results = etudiants.map(etudiant => ({
      id: etudiant._id,
      numero_matricule: etudiant.numero_matricule,
      nom_complet: `${etudiant.prenom} ${etudiant.nom}`,
      classe: etudiant.classe,
      niveau: etudiant.niveau,
      label: `${etudiant.numero_matricule} - ${etudiant.prenom} ${etudiant.nom} (${etudiant.classe})`
    }));
    
    res.json(results);
  } catch (error) {
    console.error('Erreur lors de la recherche des étudiants:', error);
    res.status(500).json({ error: 'Erreur lors de la recherche' });
  }
};
