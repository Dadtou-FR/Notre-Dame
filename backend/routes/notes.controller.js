const Note = require('../models/notes');
const Etudiant = require('../models/etudiants');

exports.getAll = async (req, res) => {
  try {
    const { matricule, matiere, session } = req.query;

    // Construire le filtre
    const filter = {};
    if (matricule) {
      filter.numero_matricule = matricule;
    }
    if (matiere) {
      filter.matiere = new RegExp(matiere, 'i');
    }
    if (session) {
      filter.session = session;
    }

    // Récupérer les notes filtrées
    const notes = await Note.find(filter).sort({ createdAt: -1 }).lean();

    // Récupérer les matières et sessions uniques pour les filtres
    const matieres = await Note.distinct('matiere').sort();
    const sessions = await Note.distinct('session').sort();

    // Grouper les notes par étudiant et session
    const groupedNotes = notes.reduce((acc, note) => {
      const key = `${note.numero_matricule}-${note.session}`;
      if (!acc[key]) {
        acc[key] = {
          numero_matricule: note.numero_matricule,
          session: note.session,
          type_evaluation: note.type_evaluation, // Prendre le premier type d'évaluation
          notes: {},
          total: 0,
          count: 0
        };
      }
      acc[key].notes[note.matiere] = { note: note.note };
      acc[key].total += note.note;
      acc[key].count += 1;
      return acc;
    }, {});

    const etudiantsNotes = Object.values(groupedNotes).map(etudiant => {
      etudiant.moyenne = etudiant.count > 0 ? (etudiant.total / etudiant.count).toFixed(2) : '0.00';
      const moy = parseFloat(etudiant.moyenne);
      if (moy >= 16) {
        etudiant.appreciation = 'Excellent';
      } else if (moy >= 14) {
        etudiant.appreciation = 'Très bien';
      } else if (moy >= 12) {
        etudiant.appreciation = 'Bien';
      } else if (moy >= 10) {
        etudiant.appreciation = 'Passable';
      } else {
        etudiant.appreciation = 'Insuffisant';
      }
      return etudiant;
    });

    const getAppreciationClass = function(moy) {
      if (moy >= 16) return 'bg-success';
      else if (moy >= 12) return 'bg-warning';
      else return 'bg-danger';
    };

    res.render("notes", { etudiantsNotes, matieres, sessions, filters: { matricule, matiere, session }, getAppreciationClass });
  } catch (error) {
    console.error('Erreur lors de la récupération des notes:', error);
    res.status(500).render('error', {
      message: 'Erreur lors de la récupération des notes',
      title: 'Erreur'
    });
  }
};

exports.showAddForm = async (req, res) => {
  try {
    const { matricule, session } = req.query;

    let prefilledData = null;

    if (matricule && session) {
      // Récupérer les notes existantes pour pré-remplir le formulaire
      const notes = await Note.find({ numero_matricule: matricule, session }).sort({ matiere: 1 });

      // Transformer les notes en objet par matière
      const notesByMatiere = notes.reduce((acc, note) => {
        acc[note.matiere] = note;
        return acc;
      }, {});

      // Récupérer l'étudiant
      const etudiant = await Etudiant.findOne({ numero_matricule: matricule });

      // Déterminer le type d'évaluation (premier trouvé ou défaut)
      const type_evaluation = notes.length > 0 ? notes[0].type_evaluation : '';

      prefilledData = {
        numero_matricule: matricule,
        session: session,
        type_evaluation: type_evaluation,
        notes: notesByMatiere,
        etudiant: etudiant
      };
    }

    const title = prefilledData && prefilledData.numero_matricule ? `Modifier les notes - ${prefilledData.numero_matricule}` : 'Ajouter des notes';

    res.render("note_add", { title, prefilledData });
  } catch (error) {
    console.error('Erreur lors de l\'affichage du formulaire d\'ajout:', error);
    res.status(500).render('error', {
      message: 'Erreur lors de l\'affichage du formulaire',
      title: 'Erreur'
    });
  }
};

exports.addBatch = async (req, res) => {
  try {
    const { numero_matricule, session, type_evaluation } = req.body;

    // Vérifier que l'étudiant existe
    const etudiant = await Etudiant.findOne({ numero_matricule });
    if (!etudiant) {
      return res.status(400).render('error', {
        message: 'Étudiant non trouvé. Veuillez sélectionner un étudiant valide.',
        title: 'Erreur'
      });
    }

    // Mapping from form keys to actual matiere names
    const matiereMapping = {
      'catechese': 'Catéchèse',
      'philosophie_initiation': 'Philosophie / Initiation',
      'malagasy': 'Malagasy',
      'francais': 'Français',
      'anglais': 'Anglais',
      'espagnol': 'Espagnol',
      'histoire_geographie': 'Histoire - Géographie',
      'mathematiques': 'Mathématiques',
      'physique_chimie': 'Physique - Chimie',
      'svt': 'SVT (Sciences de la Vie et de la Terre)',
      'informatique': 'Informatique',
      'eps': 'EPS (Éducation Physique et Sportive)'
    };

    // Build notes object from form data
    const notes = {};
    for (const [key, matiere] of Object.entries(matiereMapping)) {
      const noteKey = `note_${key}`;
      const commentaireKey = `commentaire_${key}`;
      const noteValue = req.body[noteKey];
      if (noteValue !== undefined && noteValue !== '' && noteValue !== null) {
        const parsedNote = parseFloat(noteValue);
        if (!isNaN(parsedNote) && parsedNote >= 0 && parsedNote <= 20) {
          notes[matiere] = {
            note: parsedNote,
            commentaire: req.body[commentaireKey] || null
          };
        }
      }
    }

    // Transform to array
    const notesArray = Object.entries(notes).map(([matiere, data]) => ({
      numero_matricule,
      matiere,
      note: data.note,
      session,
      type_evaluation,
      commentaire: data.commentaire
    }));

    if (notesArray.length === 0) {
      return res.status(400).render('error', {
        message: 'Aucune note valide à enregistrer. Veuillez saisir au moins une note entre 0 et 20.',
        title: 'Erreur'
      });
    }

    // For editing, delete existing notes for this student and session
    await Note.deleteMany({ numero_matricule, session });

    // Validation et création des notes
    const notesToCreate = [];
    for (const noteData of notesArray) {
      const { numero_matricule, matiere, note, session, type_evaluation, commentaire } = noteData;

      notesToCreate.push({
        numero_matricule,
        matiere,
        note: note,
        session,
        type_evaluation,
        commentaire: commentaire || null,
        annee_scolaire: etudiant.annee_scolaire
      });
    }

    if (notesToCreate.length > 0) {
      await Note.insertMany(notesToCreate);
    }

    res.redirect("/notes");
  } catch (error) {
    console.error('Erreur lors de l\'ajout des notes:', error);
    res.status(500).render('error', {
      message: 'Erreur lors de l\'ajout des notes',
      title: 'Erreur'
    });
  }
};

exports.showEditForm = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).render('error', {
        message: 'Note non trouvée',
        title: 'Erreur'
      });
    }
    res.render("note_edit", { note });
  } catch (error) {
    console.error('Erreur lors de l\'affichage de la note:', error);
    res.status(500).render('error', {
      message: 'Erreur lors de l\'affichage de la note',
      title: 'Erreur'
    });
  }
};

exports.update = async (req, res) => {
  try {
    const { numero_matricule, matiere, note, session, type_evaluation, commentaire } = req.body;

    const updateData = {
      numero_matricule,
      matiere,
      note: parseFloat(note),
      session,
      type_evaluation,
      commentaire: commentaire || null
    };

    await Note.findByIdAndUpdate(req.params.id, updateData);
    res.redirect("/notes");
  } catch (error) {
    console.error('Erreur lors de la modification de la note:', error);
    res.status(500).render('error', {
      message: 'Erreur lors de la modification de la note',
      title: 'Erreur'
    });
  }
};

exports.delete = async (req, res) => {
  try {
    await Note.findByIdAndDelete(req.params.id);
    res.redirect("/notes");
  } catch (error) {
    console.error('Erreur lors de la suppression de la note:', error);
    res.status(500).render('error', {
      message: 'Erreur lors de la suppression de la note',
      title: 'Erreur'
    });
  }
};

exports.showEditStudentForm = async (req, res) => {
  try {
    const { matricule, session } = req.params;

    // Récupérer l'étudiant
    const etudiant = await Etudiant.findOne({ numero_matricule: matricule });
    if (!etudiant) {
      return res.status(404).render('error', {
        message: 'Étudiant non trouvé',
        title: 'Erreur'
      });
    }

    // Récupérer les notes de l'étudiant pour cette session
    const notes = await Note.find({ numero_matricule: matricule, session }).sort({ matiere: 1 });

    // Transformer les notes en objet par matière
    const notesByMatiere = notes.reduce((acc, note) => {
      acc[note.matiere] = note;
      return acc;
    }, {});

    // Récupérer les matières uniques
    const matieres = [...new Set(notes.map(note => note.matiere))].sort();

    // Déterminer le type d'évaluation sélectionné (premier trouvé ou défaut)
    const selectedType = notes.length > 0 ? notes[0].type_evaluation : '';

    const title = `Modifier les notes - ${matricule}`;

    res.render("note_edit_student", { etudiant, notes, session, matricule, notesByMatiere, matieres, selectedType, title });
  } catch (error) {
    console.error('Erreur lors de l\'affichage des notes de l\'étudiant:', error);
    res.status(500).render('error', {
      message: 'Erreur lors de l\'affichage des notes',
      title: 'Erreur'
    });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const { matricule, session } = req.params;
    const { notes } = req.body;

    if (!notes || !Array.isArray(notes)) {
      return res.status(400).render('error', {
        message: 'Données de notes invalides',
        title: 'Erreur'
      });
    }

    // Supprimer les anciennes notes pour cette session
    await Note.deleteMany({ numero_matricule: matricule, session });

    // Créer les nouvelles notes
    const notesToCreate = [];
    for (const noteData of notes) {
      const { matiere, note, type_evaluation, commentaire } = noteData;

      if (matiere && note !== undefined) {
        notesToCreate.push({
          numero_matricule: matricule,
          matiere,
          note: parseFloat(note),
          session,
          type_evaluation: type_evaluation || 'Controle Continu',
          commentaire: commentaire || null
        });
      }
    }

    if (notesToCreate.length > 0) {
      await Note.insertMany(notesToCreate);
    }

    res.redirect(`/notes/edit-student/${matricule}/${session}`);
  } catch (error) {
    console.error('Erreur lors de la mise à jour des notes de l\'étudiant:', error);
    res.status(500).render('error', {
      message: 'Erreur lors de la mise à jour des notes',
      title: 'Erreur'
    });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const { matricule, session } = req.params;

    await Note.deleteMany({ numero_matricule: matricule, session });

    res.redirect("/notes");
  } catch (error) {
    console.error('Erreur lors de la suppression des notes de l\'étudiant:', error);
    res.status(500).render('error', {
      message: 'Erreur lors de la suppression des notes',
      title: 'Erreur'
    });
  }
};

exports.searchStudents = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json([]);
    }

    // Recherche d'étudiants
    const etudiants = await Etudiant.find({
      $or: [
        { numero_matricule: new RegExp(q, 'i') },
        { nom: new RegExp(q, 'i') },
        { prenom: new RegExp(q, 'i') }
      ]
    }).limit(10).lean();

    res.json(etudiants);
  } catch (error) {
    console.error('Erreur lors de la recherche d\'étudiants:', error);
    res.status(500).json({ error: 'Erreur lors de la recherche' });
  }
};
