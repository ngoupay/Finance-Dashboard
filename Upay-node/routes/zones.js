const express = require('express');
const ZoneController = require('../controllers/zone');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

router.post('/create', checkAuth, ZoneController.createZone);
router.post('/edit', checkAuth, ZoneController.updateZone);
router.delete('/:id', checkAuth, ZoneController.deleteZone);
router.get('', ZoneController.getZone);


module.exports = router;
