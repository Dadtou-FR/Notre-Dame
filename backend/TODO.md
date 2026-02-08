# TODO: Reorganize Project into Backend and Frontend Folders

## Steps to Complete Reorganization

- [x] Move backend files to backend/ folder:
  - [x] Move index.js to backend/
  - [x] Move migrate.js to backend/
  - [x] Move scripts/ to backend/
  - [x] Move package.json to backend/
  - [x] Move package-lock.json to backend/
  - [x] Move MODIFICATIONS_NOTES.md to backend/
  - [x] Move README_NOTES.md to backend/
  - [x] Move SPECS_TECHNIQUES.md to backend/
  - [x] Move TODO.md to backend/ (this file will be moved after completion)
  - [x] Move gestionecole/ to backend/
  - [x] Move oracleJdk-25/ to backend/

- [x] Move frontend files to frontend/ folder:
  - [x] Move views/ to frontend/
  - [x] Move assets/ to frontend/

- [x] Update package.json in root:
  - [x] Change "main" to "backend/index.js"
  - [x] Update scripts to use backend/index.js

- [x] Update paths in backend/index.js:
  - [x] Change views path to '../frontend/views'
  - [x] Change static path to '../frontend/assets'

- [x] Update paths in backend/scripts/seed.js:
  - [x] Ensure .env path is '../.env' (already done)

- [x] Test the reorganization:
  - [x] Run npm install in backend/
  - [x] Start the server and check if it works
  - [x] Test a few routes to ensure paths are correct

- [x] Finalize:
  - [x] Update README.md in root with new structure
  - [x] Remove old TODO.md and create new one in backend/
