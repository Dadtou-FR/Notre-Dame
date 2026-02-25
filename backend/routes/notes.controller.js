const Note = require('../models/notes');
const Etudiant = require('../models/etudiants');

exports.getAll = async (req, res) => {
  try {
    const { matricule, matiere, session } = req.query;

    // Mapping pour normaliser les noms de matières
    const matiereMapping = {
      'SVT (Sciences de la Vie et de la Terre)': 'SVT',
      'EPS (Éducation Physique et Sportive)': 'EPS'
    };
    
    function normalizeMatiere(matiere) {
      return matiereMapping[matiere] || matiere;
    }

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

    // Récupérer les matières et sessions uniques pour les filtres (normalisées)
    const matieres = (await Note.distinct('matiere').sort()).map(m => normalizeMatiere(m));
    const sessions = await Note.distinct('session').sort();

    // Grouper les notes par étudiant et session
    const groupedNotes = notes.reduce((acc, note) => {
      const key = `${note.numero_matricule}-${note.session}`;
      const matiereNorm = normalizeMatiere(note.matiere);
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
      acc[key].notes[matiereNorm] = { note: note.note };
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
