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

    res.render("notes", { notes, matieres, sessions, filters: { matricule, matiere, session } });
  } catch (error) {
    console.error('Erreur lors de la récupération des notes:', error);
    res.status(500).render('error', {
      message: 'Erreur lors de la récupération des notes',
      title: 'Erreur'
    });
  }
};

exports.showAddForm = (req, res) => {
  res.render("note_add");
};

exports.addBatch = async (req, res) => {
  try {
    const { notes } = req.body;

    if (!notes || !Array.isArray(notes)) {
      return res.status(400).render('error', {
        message: 'Données de notes invalides',
        title: 'Erreur'
      });
    }

    // Validation et création des notes
    const notesToCreate = [];
    for (const noteData of notes) {
      const { numero_matricule, matiere, note, session, type_evaluation, commentaire } = noteData;

      // Validation de base
      if (!numero_matricule || !matiere || note === undefined || !session || !type_evaluation) {
        continue; // Skip invalid entries
      }

      // Vérifier que l'étudiant existe
      const etudiant = await Etudiant.findOne({ numero_matricule });
      if (!etudiant) {
        continue; // Skip if student doesn't exist
      }

      notesToCreate.push({
        numero_matricule,
        matiere,
        note: parseFloat(note),
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

    res.render("note_edit_student", { etudiant, notes, session });
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
