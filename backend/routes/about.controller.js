// modules/about/about.controller.js

const fs = require('fs');
const path = require('path');

const showAbout = (req, res) => {
  try {
    // Lire le contenu du README.md
    const readmePath = path.join(__dirname, '../../README.md');
    const readmeContent = fs.readFileSync(readmePath, 'utf-8');

    // Extraire la section de licence MIT
    const licenseMatch = readmeContent.match(/## 📄 Licence([\s\S]*?)(?=##|$)/);
    const licenseText = licenseMatch ? licenseMatch[1].trim() : 'Licence non trouvée';

    // Informations développeur (à adapter selon vos besoins)
    const developerInfo = {
      name: 'RANDRIANAMBININA Haja Alphone',
      role: 'Développeur Full-Stack',
      email: 'ralphonsehaja@gmail.com',
      description: 'Développeur passionné spécialisé dans les applications web éducatives.',
      skills: ['Node.js', 'Express.js', 'MongoDB', 'EJS', 'Bootstrap', 'JavaScript']
    };

    res.render('about', {
      title: 'À propos',
      developerInfo,
      licenseText,
      readmeContent
    });
  } catch (error) {
    console.error('Erreur lors de la lecture du README:', error);
    res.status(500).send('Erreur lors du chargement de la page À propos');
  }
};

module.exports = {
  showAbout
};
