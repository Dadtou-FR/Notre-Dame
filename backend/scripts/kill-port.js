const { exec } = require('child_process');

// Accept port from argv or environment, default to 8080
const argvPort = process.argv[2];
const PORT = argvPort || process.env.PORT || '8080';

console.log(`Tentative de libération du port ${PORT}...`);

exec(`netstat -ano | findstr :${PORT}`, (err, stdout) => {
  if (err && !stdout) {
    console.warn(`Erreur lors de l'exécution de netstat: ${err.message}`);
    process.exit(1);
  }

  if (stdout && stdout.trim().length > 0) {
    const lines = stdout.split('\n').map(l => l.trim()).filter(Boolean);
    const pids = new Set();

    lines.forEach(line => {
      // ligne attendue: TCP    0.0.0.0:3000     0.0.0.0:0      LISTENING       1234
      const match = line.match(/LISTENING\s+(\d+)$/i) || line.match(/\s(\d+)$/);
      if (match) {
        pids.add(match[1]);
      }
    });

    if (pids.size === 0) {
      console.log(`Aucun processus LISTENING trouvé sur le port ${PORT}.`);
    }

    let killed = 0;
    pids.forEach(pid => {
      exec(`taskkill /PID ${pid} /F`, (killErr, killStdout, killStderr) => {
        if (killErr) {
          console.warn(`Échec arrêt processus ${pid}: ${killErr.message}`);
        } else {
          killed++;
          console.log(`✅ Processus ${pid} terminé`);
        }

        // when all processed
        if (killed === pids.size) {
          console.log(`Port ${PORT} libéré. Vous pouvez démarrer le serveur.`);
        }
      });
    });
  } else {
    console.log(`Aucun processus trouvé sur le port ${PORT}. Rien à faire.`);
  }
});