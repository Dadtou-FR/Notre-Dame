const AnneeScolaire = require('../annees/annees.model');
const Etudiant = require('../etudiants/etudiants.model');
const Note = require('../notes/notes.model');
const Paiement = require('../paiements/paiements.model');
const ArchiveEtudiant = require('../archives/archives.model');
const ArchivePaiement = require('../archives/archives_paiements.model');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Helper to generate PDF with retry and timeout
async function generatePDFWithRetry(page, options, maxRetries = 2, timeoutMs = 30000) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempting PDF generation (attempt ${attempt}/${maxRetries})...`);
      const pdfPromise = page.pdf(options);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`PDF generation timeout after ${timeoutMs}ms`)), timeoutMs)
      );
      const pdfBuffer = await Promise.race([pdfPromise, timeoutPromise]);
      console.log('PDF generated successfully');
      return pdfBuffer;
    } catch (err) {
      lastError = err;
      console.error(`PDF attempt ${attempt} failed:`, err.message);
      if (attempt < maxRetries) {
        console.log('Retrying...');
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      }
    }
  }
  throw lastError;
}

// Calculer la moyenne générale d'un étudiant
const calculerMoyenneGenerale = async (numeroMatricule, anneeScolaire) => {
  const notes = await Note.find({ 
    numero_matricule: numeroMatricule, 
    annee_scolaire: anneeScolaire 
  });
  
  if (notes.length === 0) return 0;
  
  const totalNotes = notes.reduce((sum, note) => sum + note.note, 0);
  return totalNotes / notes.length;
};

// Déterminer la classe suivante
const determinerClasseSuivante = (classeActuelle, niveau) => {
  const progressionClasses = {
    'Maternelles': ['PS', 'MS', 'GS'],
    'Primaires': ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
    'Premier cycle': ['6ème', '5ème', '4ème', '3ème'],
    'Second cycle': ['2nde', '1ère', 'Tle']
  };
  
  const classes = progressionClasses[niveau] || [];
  const indexActuel = classes.indexOf(classeActuelle);
  
  if (indexActuel === -1 || indexActuel === classes.length - 1) {
    return null; // Dernière classe du niveau
  }
  
  return classes[indexActuel + 1];
};

// Transition vers une nouvelle année scolaire
const transitionAnneeScolaire = async (req, res) => {
  try {
  const { nouvelleAnneeLabel, dateDebut, dateFin } = req.body;
    
    if (!nouvelleAnneeLabel || !dateDebut || !dateFin) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont requis'
      });
    }
    
    // Déduire l'année numérique de début (ex: '2024-2025' -> 2024) pour les paiements
    let nouvelleAnneeDebutNum = null;
    try {
      const parts = nouvelleAnneeLabel.split('-');
      nouvelleAnneeDebutNum = parseInt(parts[0], 10);
      if (isNaN(nouvelleAnneeDebutNum)) nouvelleAnneeDebutNum = null;
    } catch (e) {
      nouvelleAnneeDebutNum = null;
    }

    // 1. Obtenir l'année scolaire active actuelle
    const anneeActive = await AnneeScolaire.getActive();
    if (!anneeActive) {
      return res.status(400).json({
        success: false,
        message: 'Aucune année scolaire active trouvée'
      });
    }
    
    // ARCHIVAGE DES PAIEMENTS: récupérer tous les paiements liés à l'année active
    try {
      const paiementsAAArchiver = await Paiement.find({
        $or: [
          { annee_scolaire: anneeActive.annee_label },
          { annee: { $in: [parseInt(anneeActive.annee_label.split('-')[0], 10)] } }
        ]
      }).lean();

      if (paiementsAAArchiver && paiementsAAArchiver.length > 0) {
        // Créer le document d'archive des paiements
        await ArchivePaiement.creerArchive(
          anneeActive.annee_label,
          parseInt(anneeActive.annee_label.split('-')[0], 10),
          paiementsAAArchiver
        );

        // Supprimer les paiements archivés (préparer la réinitialisation)
        await Paiement.deleteMany({
          $or: [
            { annee_scolaire: anneeActive.annee_label },
            { annee: parseInt(anneeActive.annee_label.split('-')[0], 10) }
          ]
        });
      }
    } catch (errArchive) {
      console.error('Erreur lors de l\'archivage des paiements :', errArchive);
      // Ne pas arrêter la transition pour un échec d'archivage; continuer mais signaler
    }
    
    // 2. Obtenir tous les étudiants de l'année active
    const etudiants = await Etudiant.find({ 
      annee_scolaire: anneeActive.annee_label 
    });
    
    const statistiques = {
      total_etudiants: etudiants.length,
      admis: 0,
      redoublants: 0,
      sortants: 0
    };
    
    // 3. Traiter chaque étudiant
    for (const etudiant of etudiants) {
      const moyenne = await calculerMoyenneGenerale(etudiant.numero_matricule, anneeActive.annee_label);
      
      let decision = 'Sortant';
      let classeSuivante = null;
      
      if (moyenne >= 10) {
        // Étudiant admis
        decision = 'Admis';
        classeSuivante = determinerClasseSuivante(etudiant.classe, etudiant.niveau);
        
        if (classeSuivante) {
          // Mettre à jour l'étudiant pour la nouvelle année
          etudiant.annee_scolaire = nouvelleAnneeLabel;
          etudiant.classe = classeSuivante;
          await etudiant.save();
          
          // Réinitialiser les paiements pour la nouvelle année
          // Supprimer tout paiement pour cet étudiant lié à la nouvelle année
          await Paiement.deleteMany({
            numero_matricule: etudiant.numero_matricule,
            $or: [
              { annee_scolaire: nouvelleAnneeLabel },
              ...(nouvelleAnneeDebutNum ? [{ annee: nouvelleAnneeDebutNum }] : [])
            ]
          });
          
          statistiques.admis++;
        } else {
          // Dernière classe du niveau - étudiant sortant
          statistiques.sortants++;
        }
      } else {
        // Étudiant redoublant
        decision = 'Redoublant';
        statistiques.redoublants++;
        
        // Garder dans la même classe pour la nouvelle année
        etudiant.annee_scolaire = nouvelleAnneeLabel;
        await etudiant.save();

        // Réinitialiser les paiements pour la nouvelle année
        // Supprimer tout paiement pour cet étudiant lié à la nouvelle année
        await Paiement.deleteMany({
          numero_matricule: etudiant.numero_matricule,
          $or: [
            { annee_scolaire: nouvelleAnneeLabel },
            ...(nouvelleAnneeDebutNum ? [{ annee: nouvelleAnneeDebutNum }] : [])
          ]
        });
      }
      
      // 4. Archiver l'étudiant avec ses notes
      const notes = await Note.find({ 
        numero_matricule: etudiant.numero_matricule, 
        annee_scolaire: anneeActive.annee_label 
      });
      
      await ArchiveEtudiant.archiverEtudiant(
        { ...etudiant.toObject(), moyenne_generale: moyenne },
        anneeActive.annee_label,
        decision,
        classeSuivante
      );
    }
    
    // 5. Archiver l'année scolaire
    anneeActive.statistiques_transition = statistiques;
    await anneeActive.save();
    await AnneeScolaire.archiverAnnee(anneeActive._id);
    
    // 6. Créer la nouvelle année scolaire
    // Si une année avec le même label existe déjà, l'activer au lieu de recréer
    let nouvelleAnnee = await AnneeScolaire.findOne({ annee_label: nouvelleAnneeLabel });
    if (nouvelleAnnee) {
      // Activer l'année existante
      await AnneeScolaire.setActive(nouvelleAnnee._id);
      // Recharger le document actif
      nouvelleAnnee = await AnneeScolaire.findById(nouvelleAnnee._id);
    } else {
      nouvelleAnnee = await AnneeScolaire.creerNouvelleAnnee(
        nouvelleAnneeLabel,
        new Date(dateDebut),
        new Date(dateFin)
      );
    }
    
    // Émettre l'événement de transition via Socket.IO
    if (req.io) {
      req.io.emit('annee_scolaire_changed', {
        nouvelle_annee: nouvelleAnnee,
        statistiques: statistiques
      });
    }

    res.json({
      success: true,
      message: 'Transition d\'année scolaire effectuée avec succès',
      statistiques: statistiques,
      nouvelle_annee: nouvelleAnnee
    });
    
  } catch (error) {
    console.error('Erreur lors de la transition:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la transition d\'année scolaire',
      error: error.message
    });
  }
};

// Obtenir les archives d'une année
const getArchivesAnnee = async (req, res) => {
  try {
    const { annee } = req.params;
    
    const archives = await ArchiveEtudiant.getArchivesByAnnee(annee);
    const statistiques = await ArchiveEtudiant.getStatistiquesAnnee(annee);
    
    res.json({
      success: true,
      archives: archives,
      statistiques: statistiques
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des archives:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des archives',
      error: error.message
    });
  }
};

// Obtenir toutes les années archivées
const getAnneeArchives = async (req, res) => {
  try {
    const archives = await AnneeScolaire.getArchives();
    
    res.json({
      success: true,
      archives: archives
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des années archivées:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des années archivées',
      error: error.message
    });
  }
};

// Générer un bulletin pour un étudiant archivé
const genererBulletinArchive = async (req, res) => {
  try {
    const { annee, matricule } = req.params;
    
    const archive = await ArchiveEtudiant.findOne({
      annee_scolaire: annee,
      numero_matricule: matricule
    });
    
    if (!archive) {
      return res.status(404).json({
        success: false,
        message: 'Étudiant non trouvé dans les archives'
      });
    }
    
    // Récupérer les notes détaillées depuis les archives
    const notes = await Note.find({
      numero_matricule: matricule,
      annee_scolaire: annee
    }).sort({ matiere: 1, session: 1 });
    
    res.json({
      success: true,
      etudiant: archive,
      notes: notes
    });
    
  } catch (error) {
    console.error('Erreur lors de la génération du bulletin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du bulletin',
      error: error.message
    });
  }
};

// Générer le PDF du bulletin archivé
const genererBulletinArchivePDF = async (req, res) => {
  const puppeteer = require('puppeteer');
  let browser = null;
  
  try {
    const { annee, matricule } = req.params;
    
    const archive = await ArchiveEtudiant.findOne({
      annee_scolaire: annee,
      numero_matricule: matricule
    });
    
    if (!archive) {
      return res.status(404).send('Étudiant non trouvé dans les archives');
    }
    
    const notes = await Note.find({
      numero_matricule: matricule,
      annee_scolaire: annee
    }).sort({ matiere: 1, session: 1 });
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Bulletin de notes - ${annee}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body { 
            font-family: Arial, sans-serif; 
            margin: 0;
            padding: 20px 25px;
            color: #333;
            height: 100vh;
            display: flex;
            flex-direction: column;
          }
          .header { 
            text-align: center; 
            margin-bottom: 10px;
            border-bottom: 1px solid #2c3e50;
            padding-bottom: 6px;
          }
          .header h1 {
            margin: 0 0 3px 0;
            color: #2c3e50;
            font-size: 16px;
          }
          .header h2 {
            margin: 0;
            color: #7f8c8d;
            font-weight: normal;
            font-size: 11px;
          }
          .student-info { 
            margin-bottom: 10px;
            background: #f8f9fa;
            padding: 6px 10px;
            border-radius: 4px;
          }
          .student-info p {
            margin: 2px 0;
            font-size: 11px;
          }
          .table-container {
            flex: 1;
            overflow: hidden;
          }
          .table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 8px;
            font-size: 10px;
          }
          .table th, .table td { 
            border: 1px solid #ddd; 
            padding: 4px 6px; 
            text-align: left;
          }
          .table th { 
            background-color: #2c3e50;
            color: white;
            font-weight: bold;
            font-size: 10px;
          }
          .table tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          .table td:nth-child(2) {
            text-align: center;
            font-weight: bold;
          }
          .summary { 
            margin-top: auto;
            padding: 8px;
            background: #e3f2fd;
            border-left: 2px solid #2196f3;
            border-radius: 2px;
          }
          .summary p {
            margin: 3px 0;
            font-size: 11px;
          }
          .moyenne {
            font-size: 14px;
            color: #2c3e50;
            font-weight: bold;
          }
          .archive-info {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 6px;
            border-radius: 2px;
            margin-bottom: 8px;
            font-size: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>BULLETIN DE NOTES - ARCHIVE</h1>
          <h2>ECOLE CATHOLOQUE NOTRE DAME • B.P 235 MAHAJANGA • www.ecole-notredame-mahajanga.com — Année Scolaire ${annee}</h2>
        </div>
        
        <div class="archive-info">
          <strong><i class="fas fa-archive"></i> Document archivé</strong> - 
          Ce bulletin concerne l'année scolaire ${annee} (archivée)
        </div>
        
        <div class="student-info">
          <p><strong>Nom complet :</strong> ${archive.prenom} ${archive.nom}</p>
          <p><strong>Matricule :</strong> ${archive.numero_matricule}</p>
          <p><strong>Niveau :</strong> ${archive.niveau} | <strong>Classe :</strong> ${archive.classe}</p>
          <p><strong>Décision :</strong> 
            <span class="badge ${archive.decision === 'Admis' ? 'bg-success' : archive.decision === 'Redoublant' ? 'bg-warning' : 'bg-info'}">
              ${archive.decision}
            </span>
            ${archive.classe_suivante ? ` → ${archive.classe_suivante}` : ''}
          </p>
        </div>
        
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Matière</th>
                <th style="width: 80px;">Note</th>
                <th style="width: 100px;">Session</th>
                <th style="width: 120px;">Type d'évaluation</th>
                <th>Commentaire</th>
              </tr>
            </thead>
            <tbody>
              ${notes.length > 0 ? notes.map(note => `
                <tr>
                  <td>${note.matiere || 'N/A'}</td>
                  <td>${note.note}/20</td>
                  <td>${note.session || 'N/A'}</td>
                  <td style="background-color: ${note.type_evaluation && note.type_evaluation.startsWith('Exam') ? '#fff3cd' : '#d1ecf1'}; color: ${note.type_evaluation && note.type_evaluation.startsWith('Exam') ? '#856404' : '#0c5460'}; font-weight: bold;">${note.type_evaluation || 'Controle Continu'}</td>
                  <td>${note.commentaire || '-'}</td>
                </tr>
              `).join('') : '<tr><td colspan="5" style="text-align: center; padding: 15px;">Aucune note disponible</td></tr>'}
            </tbody>
          </table>
        </div>
        
        <div class="summary">
          <p class="moyenne">Moyenne générale : ${archive.moyenne_generale.toFixed(2)}/20</p>
          <p>Nombre de notes : ${notes.length}</p>
          <p>Année scolaire : ${annee}</p>
        </div>
      </body>
      </html>
    `;
    
    // Lancer Puppeteer avec profile temporaire (évite lockfile EBUSY)
    const _userDataDir_archive = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer_profile_'));
    browser = await puppeteer.launch({ 
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--disable-default-apps',
        '--disable-extensions',
        '--disable-breakpad',
        '--disable-client-side-phishing-detection',
        '--disable-sync',
        '--metrics-recording-only',
        '--no-service-autorun',
        '--password-store=basic'
      ],
      timeout: 60000,
      userDataDir: _userDataDir_archive
    });
    
    const page = await browser.newPage();
    
    // Définir le contenu
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Générer le PDF en format A4 portrait avec retry
    let pdfBuffer;
    try {
      pdfBuffer = await generatePDFWithRetry(page, {
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm'
        }
      }, 2, 30000);
    } catch (pdfErr) {
      console.error('Erreur lors de page.pdf() (archive):', pdfErr);
      await browser.close().catch(() => {});
      try { fs.rmSync(_userDataDir_archive, { recursive: true, force: true }); } catch (e) { console.warn('Cleanup profile failed:', e.message); }
      throw pdfErr;
    }
    
    // Fermer le navigateur AVANT d'envoyer la réponse et nettoyer le profil
    await browser.close();
    try { fs.rmSync(_userDataDir_archive, { recursive: true, force: true }); } catch (e) { console.warn('Cleanup profile failed:', e.message); }
    browser = null;
    
    // Envoyer le PDF
    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length,
      'Content-Disposition': `attachment; filename="bulletin_archive_${matricule}_${annee}.pdf"`
    });
    res.end(pdfBuffer);
    
  } catch (error) {
    console.error('Erreur génération PDF bulletin archivé:', error);
    
    // Fermer le navigateur en cas d'erreur
    if (browser) {
      try { await browser.close(); } catch (e) { }
    }
    
    res.status(500).send('Erreur lors de la génération du PDF: ' + error.message);
  }
};

module.exports = {
  transitionAnneeScolaire,
  getArchivesAnnee,
  getAnneeArchives,
  genererBulletinArchive,
  genererBulletinArchivePDF
};
