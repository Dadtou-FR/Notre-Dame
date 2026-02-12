const Paiement = require('../models/paiements');
const Annee = require('../models/annees');
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

exports.create = async (req, res, next) => {
  try {
    const active = await Annee.getActive();
    if (active) {
      req.body.annee_scolaire = active.annee_label;
    }
    await Paiement.create(req.body);
    res.redirect('/paiements');
  } catch (e) {
    next(e);
  }
};

// modules/paiements/paiements.controller.js
const Etudiant = require('../models/etudiants');
const { verifyPassword, logoutPayment } = require('../middleware/auth');

// Afficher la liste des paiements (vue mensuelle)
exports.listPaiements = async (req, res) => {
  try {
    const annee = parseInt(req.query.annee) || new Date().getFullYear();
    
    // Obtenir les paiements organisés par étudiant
    const paiementsParEtudiant = await Paiement.getPaiementsParEtudiant(annee);
    
    res.render('paiements', { 
      paiementsParEtudiant,
      annee
    });
  } catch (error) {
    console.error('Erreur liste paiements:', error);
    res.render('paiements', { 
      paiementsParEtudiant: [],
      annee: new Date().getFullYear()
    });
  }
};


// Ajouter un paiement
exports.addPaiement = async (req, res) => {
  try {
    const { numero_matricule, type_paiement, mois, annee, montant, date_paiement, methode_paiement, remarques } = req.body;
    
    // Debug: log des valeurs reçues
    console.log('Valeurs reçues:', { type_paiement, mois });
    
    // Vérifier que l'étudiant existe
    const etudiant = await Etudiant.findOne({ numero_matricule });
    if (!etudiant) {
      req.flash('error', 'Étudiant non trouvé');
      return res.redirect('/paiements/add');
    }
    
    // Vérifier si le paiement existe déjà
    const existant = await Paiement.findOne({
      numero_matricule,
      mois,
      annee,
      type_paiement: type_paiement || 'Scolarité'
    });
    
    if (existant) {
      req.flash('error', `Le paiement pour ${mois} ${annee} existe déjà pour cet étudiant`);
      return res.redirect('/paiements');
    }
    
    // Normaliser le type de paiement
    const normalizedTypePaiement = type_paiement === 'Droit d\'inscription' ? 'Droit' : 
                                  (type_paiement || (mois === 'Droit' ? 'Droit' : 'Scolarité'));
    
    console.log('Type de paiement normalisé:', normalizedTypePaiement);
    
    // Créer le paiement
    const paiement = new Paiement({
      numero_matricule,
      type_paiement: normalizedTypePaiement,
      mois,
      annee: annee || new Date().getFullYear(),
      montant: parseFloat(montant),
      date_paiement: date_paiement || new Date(),
      methode_paiement: methode_paiement || 'Espèces',
      statut: 'Payé',
      remarques
    });
    
    await paiement.save();
    
    req.flash('success', 'Paiement enregistré avec succès');
    res.redirect('/paiements');
    
  } catch (error) {
    console.error('Erreur ajout paiement:', error);
    req.flash('error', 'Erreur lors de l\'enregistrement: ' + error.message);
    res.redirect('/paiements/add');
  }
};

// Afficher les paiements d'un étudiant
exports.getPaiementsEtudiant = async (req, res) => {
  try {
    const { matricule } = req.params;
    const annee = parseInt(req.query.annee) || new Date().getFullYear();
    
    const etudiant = await Etudiant.findOne({ numero_matricule: matricule });
    if (!etudiant) {
      req.flash('error', 'Étudiant non trouvé');
      return res.redirect('/paiements');
    }
    
    const paiements = await Paiement.find({
      numero_matricule: matricule,
      annee
    }).sort({ date_paiement: -1 });
    
    // Calculer les statistiques
    const totalPaye = paiements.reduce((sum, p) => sum + p.montant, 0);
    const paiementsPayes = paiements.filter(p => p.statut === 'Payé').length;
    const paiementsEnRetard = paiements.filter(p => p.statut === 'En retard').length;
    
    res.render('paiement_details', {
      etudiant,
      paiements,
      statistiques: {
        totalPaye,
        paiementsPayes,
        paiementsEnRetard
      },
      annee
    });
    
  } catch (error) {
    console.error('Erreur détails paiements:', error);
    res.redirect('/paiements');
  }
};

// Afficher le formulaire de modification d'un paiement
exports.showEditForm = async (req, res) => {
  try {
    const { id } = req.params;
    const paiement = await Paiement.findById(id);

    if (!paiement) {
      req.flash('error', 'Paiement non trouvé');
      return res.redirect('/paiements');
    }

    // Récupérer les informations de l'étudiant
    const etudiant = await Etudiant.findOne({ numero_matricule: paiement.numero_matricule });

    res.render('paiement_edit', {
      paiement,
      etudiant,
      title: 'Modifier le paiement'
    });

  } catch (error) {
    console.error('Erreur affichage formulaire modification:', error);
    req.flash('error', 'Erreur lors de l\'affichage du formulaire');
    res.redirect('/paiements');
  }
};

// Modifier un paiement
exports.updatePaiement = async (req, res) => {
  try {
    const { numero_matricule, mois, annee, montant, date_paiement, methode_paiement, remarques, statut, type_paiement } = req.body;

    // Trouver le paiement par matricule, mois, année et type
    const paiement = await Paiement.findOne({
      numero_matricule,
      mois,
      annee,
      type_paiement
    });

    if (!paiement) {
      req.flash('error', 'Paiement non trouvé');
      return res.redirect('/paiements');
    }

    // Mettre à jour le paiement
    await Paiement.findByIdAndUpdate(paiement._id, {
      montant: parseFloat(montant),
      date_paiement,
      methode_paiement,
      remarques,
      statut: statut || 'Payé'
    }, { new: true, runValidators: true });

    req.flash('success', 'Paiement modifié avec succès');
    res.redirect('/paiements');

  } catch (error) {
    console.error('Erreur modification paiement:', error);
    req.flash('error', 'Erreur lors de la modification');
    res.redirect('/paiements');
  }
};

// Supprimer un paiement
exports.deletePaiement = async (req, res) => {
  try {
    const { id } = req.params;
    await Paiement.findByIdAndDelete(id);
    
    req.flash('success', 'Paiement supprimé avec succès');
    res.redirect('/paiements');
    
  } catch (error) {
    console.error('Erreur suppression paiement:', error);
    req.flash('error', 'Erreur lors de la suppression');
    res.redirect('/paiements');
  }
};

// Générer un reçu de paiement (PDF)
exports.genererRecu = async (req, res) => {
  try {
    const { matricule } = req.params;
    const annee = parseInt(req.query.annee) || new Date().getFullYear();
    
    const etudiant = await Etudiant.findOne({ numero_matricule: matricule });
    if (!etudiant) {
      return res.status(404).send('Étudiant non trouvé');
    }
    
    const paiements = await Paiement.find({
      numero_matricule: matricule,
      annee
    }).sort({ date_paiement: 1 });
    
    const totalPaye = paiements.reduce((sum, p) => sum + p.montant, 0);
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reçu de paiement - ${etudiant.prenom} ${etudiant.nom}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif; 
            padding: 30px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #667eea;
          }
          .header h1 {
            color: #667eea;
            margin-bottom: 10px;
          }
          .info-section {
            margin-bottom: 25px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 5px;
          }
          .info-section h3 {
            color: #667eea;
            margin-bottom: 10px;
            border-bottom: 2px solid #667eea;
            padding-bottom: 5px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border: 1px solid #ddd;
          }
          th {
            background: #667eea;
            color: white;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background: #f8f9fa;
          }
          .total-section {
            margin-top: 30px;
            padding: 20px;
            background: #e7f3ff;
            border-left: 5px solid #667eea;
            text-align: right;
          }
          .total-section h2 {
            color: #667eea;
            font-size: 24px;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>REÇU DE PAIEMENT</h1>
          <p>Année scolaire ${annee}-${annee + 1}</p>
        </div>
        
        <div class="info-section">
          <h3>Informations de l'étudiant</h3>
          <div class="info-row">
            <strong>Nom complet:</strong>
            <span>${etudiant.prenom} ${etudiant.nom}</span>
          </div>
          <div class="info-row">
            <strong>Matricule:</strong>
            <span>${etudiant.numero_matricule}</span>
          </div>
          <div class="info-row">
            <strong>Classe:</strong>
            <span>${etudiant.classe}</span>
          </div>
          <div class="info-row">
            <strong>Téléphone parent:</strong>
            <span>${etudiant.telephone_parent}</span>
          </div>
        </div>
        
        <h3 style="margin: 20px 0 10px 0; color: #667eea;">Détail des paiements</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Période</th>
              <th>Méthode</th>
              <th style="text-align: right;">Montant</th>
            </tr>
          </thead>
          <tbody>
            ${paiements.map(p => `
              <tr>
                <td>${new Date(p.date_paiement).toLocaleDateString('fr-FR')}</td>
                <td>${p.type_paiement}</td>
                <td>${p.mois}</td>
                <td>${p.methode_paiement}</td>
                <td style="text-align: right;"><strong>${p.montant.toLocaleString()} Ar</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="total-section">
          <h2>Total payé: ${totalPaye.toLocaleString()} Ar</h2>
          <p>Nombre de paiements: ${paiements.length}</p>
        </div>
        
        <div class="footer">
          <p>Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
          <p>ECOLE NOTRE DAME - MAHAJANGA</p>
        </div>
      </body>
      </html>
    `;
    
    const puppeteer = require('puppeteer');
    const _userDataDir_recu = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer_profile_'));
    const browser = await puppeteer.launch({ 
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
      userDataDir: _userDataDir_recu
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    let pdfBuffer;
    try {
      pdfBuffer = await generatePDFWithRetry(page, {
        format: 'A4',
        printBackground: true,
        margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' }
      }, 2, 30000);
    } catch (pdfErr) {
      console.error('Erreur lors de page.pdf() (reçu):', pdfErr);
      await browser.close().catch(() => {});
      try { fs.rmSync(_userDataDir_recu, { recursive: true, force: true }); } catch (e) { console.warn('Cleanup profile failed:', e.message); }
      throw pdfErr;
    }
    
    await browser.close();
    try { fs.rmSync(_userDataDir_recu, { recursive: true, force: true }); } catch (e) { console.warn('Cleanup profile failed:', e.message); }
    
    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length,
      'Content-Disposition': `attachment; filename="recu_${matricule}_${annee}.pdf"`
    });
    res.end(pdfBuffer);
    
  } catch (error) {
    console.error('Erreur génération reçu:', error);
    res.status(500).send('Erreur lors de la génération du reçu');
  }
};

// Rechercher des étudiants pour les paiements
exports.searchEtudiants = async (req, res) => {
  try {
    const { search } = req.query;
    
    if (!search) {
      return res.json({ success: false, message: 'Terme de recherche manquant' });
    }
    
    const etudiants = await Etudiant.find({
      $or: [
        { nom: new RegExp(search, 'i') },
        { prenom: new RegExp(search, 'i') },
        { numero_matricule: new RegExp(search, 'i') },
        { telephone_parent: new RegExp(search, 'i') }
      ]
    }).limit(10);
    
    res.json({ success: true, etudiants });
    
  } catch (error) {
    console.error('Erreur recherche étudiants:', error);
    res.json({ success: false, message: 'Erreur lors de la recherche' });
  }
};

// Statistiques des paiements
exports.getStatistiques = async (req, res) => {
  try {
    const annee = parseInt(req.query.annee) || new Date().getFullYear();

    const totalPaiements = await Paiement.countDocuments({ annee });
    const totalMontant = await Paiement.aggregate([
      { $match: { annee } },
      { $group: { _id: null, total: { $sum: '$montant' } } }
    ]);

    const paiementsParMois = await Paiement.aggregate([
      { $match: { annee } },
      { $group: { _id: '$mois', total: { $sum: '$montant' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);

    res.json({
      success: true,
      statistiques: {
        totalPaiements,
        totalMontant: totalMontant[0]?.total || 0,
        paiementsParMois
      }
    });

  } catch (error) {
    console.error('Erreur statistiques:', error);
    res.json({ success: false, message: 'Erreur lors du calcul des statistiques' });
  }
};

// Récupérer un paiement spécifique
exports.getPayment = async (req, res) => {
  try {
    const { matricule, mois, annee } = req.query;
    const type_paiement = mois === 'Droit' ? 'Droit' : 'Scolarité';
    const paiement = await Paiement.findOne({
      numero_matricule: matricule,
      mois,
      annee: parseInt(annee),
      type_paiement
    });
    if (!paiement) {
      return res.json({ success: false, message: 'Paiement non trouvé' });
    }
    res.json({ success: true, paiement });
  } catch (error) {
    console.error('Erreur get payment:', error);
    res.json({ success: false, message: 'Erreur' });
  }
};

// Paiements journaliers
exports.getDailyPaiements = async (req, res) => {
  try {
    const { date } = req.params;
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    
    const paiements = await Paiement.find({
      date_paiement: {
        $gte: startDate,
        $lt: endDate
      }
    });
    
    // Récupérer les informations des étudiants
    const matricules = [...new Set(paiements.map(p => p.numero_matricule))];
    const etudiants = await Etudiant.find({ numero_matricule: { $in: matricules } });
    const etudiantsMap = {};
    etudiants.forEach(e => {
      etudiantsMap[e.numero_matricule] = e;
    });
    
    // Ajouter les informations des étudiants aux paiements
    const paiementsAvecEtudiants = paiements.map(p => ({
      ...p.toObject(),
      etudiant: etudiantsMap[p.numero_matricule]
    }));
    
    const total = paiements.reduce((sum, p) => sum + p.montant, 0);
    const students = [...new Set(paiements.map(p => p.numero_matricule))].length;
    
    res.json({
      success: true,
      count: paiements.length,
      total: total,
      students: students,
      paiements: paiementsAvecEtudiants
    });
    
  } catch (error) {
    console.error('Erreur paiements journaliers:', error);
    res.json({ success: false, message: 'Erreur lors de la récupération des paiements' });
  }
};

// Générer PDF des paiements journaliers
exports.genererDailyPDF = async (req, res) => {
  try {
    const { date } = req.params;
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    
    const paiements = await Paiement.find({
      date_paiement: {
        $gte: startDate,
        $lt: endDate
      }
    });
    
    // Récupérer les informations des étudiants
    const matricules = [...new Set(paiements.map(p => p.numero_matricule))];
    const etudiants = await Etudiant.find({ numero_matricule: { $in: matricules } });
    const etudiantsMap = {};
    etudiants.forEach(e => {
      etudiantsMap[e.numero_matricule] = e;
    });
    
    // Ajouter les informations des étudiants aux paiements
    const paiementsAvecEtudiants = paiements.map(p => ({
      ...p.toObject(),
      etudiant: etudiantsMap[p.numero_matricule]
    }));
    
    const total = paiements.reduce((sum, p) => sum + p.montant, 0);
    const students = [...new Set(paiements.map(p => p.numero_matricule))].length;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Paiements du ${new Date(date).toLocaleDateString('fr-FR')}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif; 
            padding: 30px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #667eea;
          }
          .header h1 {
            color: #667eea;
            margin-bottom: 10px;
          }
          .stats {
            display: flex;
            justify-content: space-around;
            margin-bottom: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
          }
          .stat-item {
            text-align: center;
          }
          .stat-item h3 {
            color: #667eea;
            font-size: 24px;
            margin-bottom: 5px;
          }
          .stat-item p {
            color: #666;
            font-size: 14px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border: 1px solid #ddd;
          }
          th {
            background: #667eea;
            color: white;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background: #f8f9fa;
          }
          .total-section {
            margin-top: 30px;
            padding: 20px;
            background: #e7f3ff;
            border-left: 5px solid #667eea;
            text-align: right;
          }
          .total-section h2 {
            color: #667eea;
            font-size: 24px;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>RAPPORT DES PAIEMENTS</h1>
          <p>Date: ${new Date(date).toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
        </div>
        
        <div class="stats">
          <div class="stat-item">
            <h3>${paiementsAvecEtudiants.length}</h3>
            <p>Paiements</p>
          </div>
          <div class="stat-item">
            <h3>${total.toLocaleString()} Ar</h3>
            <p>Total</p>
          </div>
          <div class="stat-item">
            <h3>${students}</h3>
            <p>Étudiants</p>
          </div>
        </div>
        
        <h3 style="margin: 20px 0 10px 0; color: #667eea;">Détail des paiements</h3>
        <table>
          <thead>
            <tr>
              <th>Heure</th>
              <th>Étudiant</th>
              <th>Matricule</th>
              <th>Classe</th>
              <th>Type</th>
              <th>Méthode</th>
              <th style="text-align: right;">Montant</th>
            </tr>
          </thead>
          <tbody>
            ${paiementsAvecEtudiants.map(p => `
              <tr>
                <td>${new Date(p.date_paiement).toLocaleTimeString('fr-FR')}</td>
                <td>${p.etudiant?.prenom || ''} ${p.etudiant?.nom || ''}</td>
                <td>${p.numero_matricule}</td>
                <td>${p.etudiant?.classe || ''}</td>
                <td>${p.type_paiement}</td>
                <td>${p.methode_paiement}</td>
                <td style="text-align: right;"><strong>${p.montant.toLocaleString()} Ar</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="total-section">
          <h2>Total de la journée: ${total.toLocaleString()} Ar</h2>
          <p>Nombre de paiements: ${paiementsAvecEtudiants.length} | Nombre d'étudiants: ${students}</p>
        </div>
        
        <div class="footer">
          <p>Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
          <p>ECOLE NOTRE DAME - MAHAJANGA</p>
        </div>
      </body>
      </html>
    `;
    
    const puppeteer = require('puppeteer');
    const _userDataDir_daily = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer_profile_'));
    const browser = await puppeteer.launch({ 
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
      userDataDir: _userDataDir_daily
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    let pdfBuffer;
    try {
      pdfBuffer = await generatePDFWithRetry(page, {
        format: 'A4',
        printBackground: true,
        margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' }
      }, 2, 30000);
    } catch (pdfErr) {
      console.error('Erreur lors de page.pdf() (daily):', pdfErr);
      await browser.close().catch(() => {});
      try { fs.rmSync(_userDataDir_daily, { recursive: true, force: true }); } catch (e) { console.warn('Cleanup profile failed:', e.message); }
      throw pdfErr;
    }
    
    await browser.close();
    try { fs.rmSync(_userDataDir_daily, { recursive: true, force: true }); } catch (e) { console.warn('Cleanup profile failed:', e.message); }
    
    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length,
      'Content-Disposition': `attachment; filename="paiements_${date}.pdf"`
    });
    res.end(pdfBuffer);
    
  } catch (error) {
    console.error('Erreur génération PDF journalier:', error);
    res.status(500).send('Erreur lors de la génération du PDF');
  }
};

// Afficher la page de connexion pour les paiements
exports.showLogin = (req, res) => {
  res.render('paiements_login', {
    title: 'Connexion - Paiements',
    errorMessage: req.flash('error'),
    successMessage: req.flash('success')
  });
};

// Traiter la connexion pour les paiements
exports.login = (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    req.flash('error', 'Veuillez saisir le mot de passe');
    return res.redirect('/paiements/login');
  }
  
  if (verifyPassword(password)) {
    // Authentification réussie
    req.session.paymentAuthenticated = true;
    req.session.paymentLoginTime = new Date();
    req.flash('success', 'Connexion réussie');
    res.redirect('/paiements');
  } else {
    // Mot de passe incorrect
    req.flash('error', 'Mot de passe incorrect');
    res.redirect('/paiements/login');
  }
};

// Déconnexion des paiements
exports.logout = (req, res) => {
  req.session.paymentAuthenticated = false;
  req.session.paymentLoginTime = null;
  req.flash('success', 'Déconnexion réussie');
  res.redirect('/paiements/login');
};