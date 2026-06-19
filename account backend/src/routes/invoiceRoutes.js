const express = require('express');
const router = express.Router();
const { createInvoice } = require('../controllers/invoiceController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.post('/', requireRole(['COMPANY_ADMIN', 'SUPERADMIN']), createInvoice);

module.exports = router;
