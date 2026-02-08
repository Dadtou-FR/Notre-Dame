const router = require('express').Router();
const controller = require('./annees.controller');

router.get('/', controller.list);
router.post('/', controller.create);
router.post('/:id/activer', controller.setActive);
router.get('/active', controller.getActive);
router.get('/archives', controller.getArchives);

module.exports = router;


