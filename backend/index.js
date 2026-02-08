const express = require('express');
const cors = require('cors');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const puppeteer = require('puppeteer');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const fs = require('fs');
const os = require('os');

const { connectDB } = require('./config/db');

// Helper to launch Chromium with a unique user profile to avoid lockfile conflicts on Windows
async function launchBrowser() {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer_profile_'));
  const launchOptions = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-breakpad',
      '--disable-client-side-phishing-detection',
      '--disable-sync',
      '--metrics-recording-only',
      '--no-service-autorun',
      '--password-store=basic'
    ],
    timeout: 60000,
    userDataDir
  };

  // Optional debug: pipe browser stdout/stderr to node stdout when env var set
  if (process.env.PUPPETEER_DUMPIO === 'true') launchOptions.dumpio = true;
  if (process.env.PUPPETEER_EXECUTABLE_PATH) launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;

  const browser = await puppeteer.launch(launchOptions);
  return { browser, userDataDir };
}

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

// Import des routes existantes (MVC)
const etudiantRoutes = require('./routes/etudiants');
const enseignantRoutes = require('./routes/enseignants');
const paiementRoutes = require('./routes/paiements');
const noteRoutes = require('./routes/notes');
const anneeRoutes = require('./routes/annees');
const transitionRoutes = require('./routes/transitions');

// Import des modèles
const Etudiant = require('./models/etudiants');
const Enseignant = require('./models/enseignants');
const Paiement = require('./models/paiements');
const Document = require('./models/documents');
const Note = require('./models/notes');

const app = express();
const PORT = process.env.PORT || 8080;

// Créer le serveur HTTP et Socket.IO
const httpServer = createServer(app);
const io = new Server(httpServer);

// Middleware pour rendre io accessible aux routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Gestion des connexions Socket.IO
io.on('connection', (socket) => {
  console.log('Client connecté:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client déconnecté:', socket.id);
  });
});

// Configuration du moteur de template
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../frontend/views'));

// Middleware - IMPORTANT: json() et urlencoded() AVANT les routes PDF
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, '../frontend/assets')));

// Configuration des sessions
app.use(session({
  secret: process.env.SESSION_SECRET || 'gestion-ecole-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000 } // 24 heures 
}));

app.use(flash());

// Middleware global pour les messages flash
app.use((req, res, next) => {
  res.locals.successMessage = req.flash('success');
  res.locals.errorMessage = req.flash('error');
  res.locals.user = req.session ? req.session.user || null : null;
  next();
});

// Auth middleware/routes
const auth = require('./middleware/auth');
const authRoutes = require('./routes/auth.routes');

// Monter les routes d'auth (login/logout)
app.use('/', authRoutes);

// Protéger l'application (toutes les routes après cette ligne requièrent une session)
app.use(auth.requireLogin);

// Accueil: tableau de bord statistiques
app.get('/', async (req, res, next) => {
  try {
    const [nbEtudiants, nbEnseignants, nbPaiements, sommePaiements, nbTelephones, nbNotes, nbBulletins, nbCertificats] = await Promise.all([
      Etudiant.countDocuments({}),
      Enseignant.countDocuments({}),
      Paiement.countDocuments({}),
      Paiement.aggregate([
        { $group: { _id: null, total: { $sum: "$montant" } } }
      ]),
      Etudiant.countDocuments({ telephone_parent: { $ne: null, $ne: '' } }),
      Note.countDocuments({}),
      Document.countDocuments({ type: 'bulletin' }),
      Document.countDocuments({ type: 'certificat' })
    ]);

    const totalEncaissé = (sommePaiements && sommePaiements[0] ? sommePaiements[0].total : 0) || 0;

    res.render('index', {
      title: 'Tableau de bord',
      stats: {
        etudiants: nbEtudiants,
        enseignants: nbEnseignants,
        paiements: nbPaiements,
        totalEncaisse: totalEncaissé,
        telephones: nbTelephones,
        notes: nbNotes,
        bulletins: nbBulletins,
        certificats: nbCertificats
      }
    });
  } catch (err) {
    next(err);
  }
});

// Page de gestion des années (UI simple)
app.get('/annees', async (req, res, next) => {
  try {
    const Annee = require('./models/annees');
    const annees = await Annee.find().sort({ date_debut: -1 }).lean();
    res.render('annees', { title: 'Années scolaires', annees });
  } catch (err) {
    next(err);
  }
});

// Page de gestion des transitions d'année scolaire
app.get('/transitions', (req, res) => {
  res.render('transitions', { title: 'Gestion des Années Scolaires' });
});

// Page pour générer les bulletins des années archivées
app.get('/bulletins-archives', (req, res) => {
  res.render('bulletin_archive', { title: 'Bulletins Archivés' });
});

// Certificat de scolarité - Page de formulaire
app.get('/certificat', async (req, res, next) => {
  try {
    const { matricule } = req.query || {};
    let etudiant = null;
    if (matricule) {
      etudiant = await Etudiant.findOne({ numero_matricule: matricule }).lean();
    }
    res.render('certificat', { 
      title: 'Certificat de scolarité', 
      etudiant, 
      query: { matricule: matricule || '' } 
    });
  } catch (err) {
    next(err);
  }
});

// Génération du PDF du certificat - FORMAT A5 PAYSAGE
app.get('/certificat/pdf', async (req, res) => {
  let browser = null;
  
  try {
    const { matricule } = req.query;
    if (!matricule) {
      return res.status(400).send('Matricule requis');
    }

    const etudiant = await Etudiant.findOne({ numero_matricule: matricule }).lean();
    if (!etudiant) {
      return res.status(404).send('Élève non trouvé');
    }

    // Utiliser les données de l'étudiant avec fallback sur req.query
    const nom = req.query.nom || etudiant.nom || '';
    const prenom = req.query.prenom || etudiant.prenom || '';
    const date_naissance = req.query.date_naissance || (etudiant.date_naissance ? new Date(etudiant.date_naissance).toLocaleDateString('fr-FR') : '');
    const lieu_naissance = req.query.lieu_naissance || etudiant.lieu_naissance || '';
    const nom_pere = req.query.nom_pere || etudiant.nom_pere || '';
    const nom_mere = req.query.nom_mere || etudiant.nom_mere || '';
    const acte_numero = req.query.acte_numero || etudiant.acte_numero || '';
    const acte_du = req.query.acte_du || (etudiant.acte_date ? new Date(etudiant.acte_date).toLocaleDateString('fr-FR') : '');
    const frequente_du = req.query.frequente_du || '';
    const frequente_au = req.query.frequente_au || '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Certificat de scolarité</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: "Times New Roman", Times, serif; 
            margin: 20px 25px; 
            color: #000; 
            line-height: 1.4;
          }
          .header { 
            text-align: left; 
            margin-bottom: 15px;
            font-size: 10px;
            line-height: 1.3;
          }
          .title { 
            text-align: center; 
            margin: 20px 0 15px 0; 
            font-weight: 700; 
            letter-spacing: 2px;
            font-size: 14px;
            text-decoration: underline;
          }
          .intro {
            margin: 15px 0 10px 0;
            font-size: 11px;
            text-align: justify;
          }
          .info-line { 
            font-size: 11px; 
            margin: 8px 0;
          }
          .dotline { 
            border-bottom: 1px dotted #000; 
            display: inline-block; 
            min-width: 150px;
            padding: 0 5px 1px 5px;
          }
          .footer { 
            margin-top: 30px;
            text-align: right;
            font-size: 11px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <strong>ECOLE CATHOLOQUE NOTRE DAME</strong><br>
          B.P 235 MAHAJANGA<br>
          <span>www.ecole-notredame-mahajanga.com</span>
        </div>

        <h2 class="title">CERTIFICAT DE SCOLARITÉ</h2>

        <p class="intro">Je soussignée, Soeur RAKOTONDRAFARA Bernadette, Directrice du LYCEE PRIVE NOTRE DAME MAHAJANGA, (selon la décision Ministérielle N° 124/2017 - MEN du 21.12.2017), certifie que l'élève :</p>
        
        <p class="info-line">Nom : <span class="dotline">${nom}</span></p>
        <p class="info-line">Prénom : <span class="dotline">${prenom}</span></p>
        <p class="info-line">Né(e) le : <span class="dotline">${date_naissance}</span> à : <span class="dotline">${lieu_naissance}</span></p>
        <p class="info-line">N° Matricule : <span class="dotline">${etudiant.numero_matricule}</span></p>
        <p class="info-line">Fréquente l'établissement du : <span class="dotline">${frequente_du}</span> au : <span class="dotline">${frequente_au}</span></p>
        <p class="info-line">Nom du Père : <span class="dotline">${nom_pere}</span></p>
        <p class="info-line">Nom de la Mère : <span class="dotline">${nom_mere}</span></p>
        <p class="info-line">Acte d'État Civil N° : <span class="dotline">${acte_numero}</span> Du : <span class="dotline">${acte_du}</span></p>

        <div class="footer">
          <p>Mahajanga, le ____________________</p>
          <br>
          <p><strong>La Direction</strong></p>
        </div>
      </body>
      </html>
    `;

    // Lancer Puppeteer avec profile temporaire (évite lockfile EBUSY)
    {
      const _launch = await launchBrowser();
      browser = _launch.browser;
      var _userDataDir_cert = _launch.userDataDir;
    }
    
    const page = await browser.newPage();
    
    // Définir le contenu
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Diagnostics: listen for page/browser errors and disconnects
    page.on('error', (err) => console.error('Puppeteer page error:', err));
    page.on('pageerror', (err) => console.error('Puppeteer pageerror:', err));
    browser.on('disconnected', () => console.error('Puppeteer browser disconnected unexpectedly'));

    // Générer le PDF en format A5 paysage avec retry
    let pdfBuffer;
    try {
      pdfBuffer = await generatePDFWithRetry(page, {
        width: '210mm',      // A5 paysage: largeur = hauteur A4
        height: '148mm',     // A5 paysage: hauteur = largeur A4 / 2
        printBackground: true,
        preferCSSPageSize: false,
        margin: { 
          top: '10mm', 
          right: '12mm', 
          bottom: '10mm', 
          left: '12mm' 
        }
      }, 2, 30000);
    } catch (pdfErr) {
      console.error('Erreur lors de page.pdf() (certificat):', pdfErr);
      await browser.close().catch(() => {});
      try { fs.rmSync(_userDataDir_cert, { recursive: true, force: true }); } catch (e) { console.warn('Cleanup profile failed:', e.message); }
      throw pdfErr;
    }

    // Fermer le navigateur AVANT d'envoyer la réponse et nettoyer le profil
    await browser.close();
    try { fs.rmSync(_userDataDir_cert, { recursive: true, force: true }); } catch (e) { console.warn('Cleanup profile failed:', e.message); }
    browser = null;

    // Log document
    try { 
      await Document.create({ 
        type: 'certificat', 
        numero_matricule: etudiant.numero_matricule, 
        meta: { nom, prenom },
        createdAt: new Date()
      }); 
    } catch (e) { 
      console.warn('Log certificat échoué:', e.message); 
    }

    // Envoyer le PDF - IMPORTANT: définir les headers AVANT d'envoyer
    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length,
      'Content-Disposition': `attachment; filename="certificat_${etudiant.numero_matricule}.pdf"`
    });
    res.end(pdfBuffer);

  } catch (err) {
    console.error('Erreur génération certificat:', err);
    
    // Fermer le navigateur en cas d'erreur
    if (browser) {
      try { await browser.close(); } catch (e) { }
    }
    
    res.status(500).send('Erreur lors de la génération du certificat: ' + err.message);
  }
});

// Route pour afficher les bulletins
app.get('/bulletin', async (req, res) => {
  try {
    const { matricule } = req.query || {};
    let etudiant = null;
    let allNotes = []; // Stocker toutes les notes brutes
    
    if (matricule) {
      etudiant = await Etudiant.findOne({ numero_matricule: matricule }).lean();
      
      if (etudiant) {
        // Récupérer toutes les notes de l'étudiant
        allNotes = await Note.find({ numero_matricule: matricule }).lean();
      }
    }
    
    res.render('bulletin', { 
      title: 'Génération de bulletins',
      etudiant,
      allNotes, // Passer toutes les notes à la vue
      query: { matricule: matricule || '' }
    });
  } catch (err) {
    console.error('Erreur affichage bulletin:', err);
    res.status(500).send('Erreur lors de l\'affichage du bulletin');
  }
});

// API de recherche d'étudiants pour l'autocomplétion du bulletin
app.get('/api/search-etudiants', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]);
    }
    
    // Recherche intelligente : matricule, nom, prénom, classe
    const etudiants = await Etudiant.find({
      $or: [
        { numero_matricule: new RegExp(q, 'i') },
        { nom: new RegExp(q, 'i') },
        { prenom: new RegExp(q, 'i') },
        { classe: new RegExp(q, 'i') }
      ]
    }).limit(10).lean();
    
    res.json(etudiants);
  } catch (error) {
    console.error('Erreur recherche étudiants:', error);
    res.status(500).json({ error: 'Erreur lors de la recherche' });
  }
});

// API de recherche d'étudiants pour l'autocomplétion
app.get('/api/etudiants/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ success: true, etudiants: [] });
    }
    
    // Recherche intelligente : matricule, nom, prénom, classe, téléphone
    const etudiants = await Etudiant.find({
      $or: [
        { numero_matricule: new RegExp(q, 'i') },
        { nom: new RegExp(q, 'i') },
        { prenom: new RegExp(q, 'i') },
        { classe: new RegExp(q, 'i') },
        { telephone_parent: new RegExp(q, 'i') },
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ['$prenom', ' ', '$nom'] },
              regex: q,
              options: 'i'
            }
          }
        }
      ]
    })
    .select('numero_matricule nom prenom niveau classe')
    .limit(10)
    .lean();
    
    // Trier les résultats par pertinence
    const results = etudiants.map(etudiant => ({
      matricule: etudiant.numero_matricule,
      nom: etudiant.nom,
      prenom: etudiant.prenom,
      niveau: etudiant.niveau,
      classe: etudiant.classe,
      displayName: `${etudiant.prenom} ${etudiant.nom} (${etudiant.numero_matricule})`,
      // Score de pertinence
      score: calculateRelevanceScore(q, etudiant)
    })).sort((a, b) => b.score - a.score);
    
    res.json({ success: true, etudiants: results });
    
  } catch (error) {
    console.error('Erreur recherche étudiants:', error);
    res.json({ success: false, message: 'Erreur lors de la recherche' });
  }
});

// Fonction pour calculer le score de pertinence
function calculateRelevanceScore(query, etudiant) {
  const q = query.toLowerCase();
  let score = 0;
  
  // Matricule exact : score le plus élevé
  if (etudiant.numero_matricule.toLowerCase() === q) {
    score += 100;
  } else if (etudiant.numero_matricule.toLowerCase().startsWith(q)) {
    score += 80;
  } else if (etudiant.numero_matricule.toLowerCase().includes(q)) {
    score += 60;
  }
  
  // Nom exact
  if (etudiant.nom.toLowerCase() === q) {
    score += 90;
  } else if (etudiant.nom.toLowerCase().startsWith(q)) {
    score += 70;
  } else if (etudiant.nom.toLowerCase().includes(q)) {
    score += 50;
  }
  
  // Prénom exact
  if (etudiant.prenom.toLowerCase() === q) {
    score += 90;
  } else if (etudiant.prenom.toLowerCase().startsWith(q)) {
    score += 70;
  } else if (etudiant.prenom.toLowerCase().includes(q)) {
    score += 50;
  }
  
  // Nom complet
  const nomComplet = `${etudiant.prenom} ${etudiant.nom}`.toLowerCase();
  if (nomComplet.includes(q)) {
    score += 40;
  }
  
  return score;
}

// Route pour générer le PDF du bulletin - FORMAT A4 PORTRAIT OPTIMISÉ
app.get('/bulletin/pdf', async (req, res) => {
  let browser = null;
  
  try {
    const { matricule } = req.query;
    
    if (!matricule) {
      return res.status(400).send('Matricule requis');
    }
    
    const etudiant = await Etudiant.findOne({ numero_matricule: matricule }).lean();
    if (!etudiant) {
      return res.status(404).send('Élève non trouvé');
    }
    
    const notes = await Note.find({ numero_matricule: matricule }).sort({ createdAt: -1 }).lean();
    const moyenneGenerale = notes.length > 0 ? notes.reduce((total, note) => total + note.note, 0) / notes.length : 0;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Bulletin de notes</title>
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
        </style>
      </head>
      <body>
        <div class="header">
          <h1>BULLETIN DE NOTES</h1>
          <h2>ECOLE CATHOLOQUE NOTRE DAME • B.P 235 MAHAJANGA • www.ecole-notredame-mahajanga.com</h2>
        </div>
        
        <div class="student-info">
          <p><strong>Nom complet :</strong> ${etudiant.prenom} ${etudiant.nom}</p>
          <p><strong>Matricule :</strong> ${etudiant.numero_matricule}</p>
          <p><strong>Niveau :</strong> ${etudiant.niveau} | <strong>Classe :</strong> ${etudiant.classe}</p>
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
          <p class="moyenne">Moyenne générale : ${moyenneGenerale.toFixed(2)}/20</p>
          <p>Nombre de notes : ${notes.length}</p>
        </div>
      </body>
      </html>
    `;
    
    // Lancer Puppeteer avec profile temporaire (évite lockfile EBUSY)
    {
      const _launch = await launchBrowser();
      browser = _launch.browser;
      var _userDataDir_bulletin = _launch.userDataDir;
    }
    
    const page = await browser.newPage();
    
    // Définir le contenu
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Diagnostics: listen for page/browser errors and disconnects
    page.on('error', (err) => console.error('Puppeteer page error:', err));
    page.on('pageerror', (err) => console.error('Puppeteer pageerror:', err));
    browser.on('disconnected', () => console.error('Puppeteer browser disconnected unexpectedly'));

    // Générer le PDF en format A4 portrait avec retry et capture diagnostique en cas d'erreur
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
      console.error('Erreur lors de page.pdf():', pdfErr);
      try {
        const debugDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer_debug_'));
        const htmlPath = path.join(debugDir, `bulletin_${etudiant.numero_matricule}.html`);
        const imgPath = path.join(debugDir, `bulletin_${etudiant.numero_matricule}.png`);
        const content = await page.content().catch(() => '<html><body>Page detached</body></html>');
        fs.writeFileSync(htmlPath, content, 'utf8');
        await page.screenshot({ path: imgPath, fullPage: true }).catch(() => {});
        console.error('Diagnostics saved to:', htmlPath, imgPath);
      } catch (diagErr) {
        console.error('Failed to capture diagnostics:', diagErr);
      }
      throw pdfErr;
    }
    
    // Fermer le navigateur AVANT d'envoyer la réponse et nettoyer le profil
    await browser.close();
    try { fs.rmSync(_userDataDir_bulletin, { recursive: true, force: true }); } catch (e) { console.warn('Cleanup profile failed:', e.message); }
    browser = null;
    
    // Log document
    try { 
      await Document.create({ 
        type: 'bulletin', 
        numero_matricule: etudiant.numero_matricule, 
        meta: { notes: notes.length, moyenne: moyenneGenerale },
        createdAt: new Date()
      }); 
    } catch (e) { 
      console.warn('Log bulletin échoué:', e.message); 
    }
    
    // Envoyer le PDF - IMPORTANT: définir les headers AVANT d'envoyer
    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length,
      'Content-Disposition': `attachment; filename="bulletin_${etudiant.numero_matricule}.pdf"`
    });
    res.end(pdfBuffer);
    
  } catch (error) {
    console.error('Erreur génération PDF bulletin:', error);
    
    // Fermer le navigateur en cas d'erreur
    if (browser) {
      try { await browser.close(); } catch (e) { }
    }
    
    res.status(500).send('Erreur lors de la génération du PDF: ' + error.message);
  }
});

// Montage des routes MVC
app.use('/etudiants', etudiantRoutes);
app.use('/enseignants', enseignantRoutes);
app.use('/paiements', paiementRoutes);
app.use('/notes', noteRoutes);
app.use('/annees-scolaires', anneeRoutes);
app.use('/transitions', transitionRoutes);
// Admin users management
const usersRoutes = require('./routes/users');
app.use('/admin/users', usersRoutes);

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).send('Page non trouvée');
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Erreur serveur: ' + err.message);
});

// Initialisation DB (MongoDB) et démarrage
connectDB()
  .then(() => {
    // Écouter via httpServer parce que Socket.IO est attaché à httpServer
    httpServer.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT}`);
      console.log(`Accès: http://localhost:${PORT}`);
    });

    // Gérer proprement les erreurs d'écoute (par ex. EADDRINUSE)
    httpServer.on('error', (err) => {
      if (err && err.code === 'EADDRINUSE') {
        console.error(`Erreur: le port ${PORT} est déjà utilisé. Merci de libérer le port ou de définir PORT dans l'environnement.`);
        // Ne pas laisser l'erreur non gérée (évite le throw non attrapé vu précédemment)
        process.exit(1);
      } else {
        console.error('Erreur serveur HTTP non gérée:', err);
        process.exit(1);
      }
    });
  })
  .catch((err) => {
    console.error('Erreur connexion MongoDB:', err);
    process.exit(1);
  });

module.exports = app;