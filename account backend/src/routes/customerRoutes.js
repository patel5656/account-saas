const express = require('express');
const router = express.Router();
const { getCustomers, createCustomer } = require('../controllers/customerController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/', requireRole(['COMPANY_ADMIN', 'SUPERADMIN']), getCustomers);
router.post('/', requireRole(['COMPANY_ADMIN', 'SUPERADMIN']), createCustomer);

module.exports = router;
