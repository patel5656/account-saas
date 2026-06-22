const express = require('express');
const router = express.Router();
const { getIncomes, createIncome, updateIncome, deleteIncome, mergeIncomes } = require('../controllers/incomeController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/', getIncomes);
router.post('/', requireRole(['COMPANY_ADMIN', 'STAFF']), createIncome);
router.put('/:id', requireRole(['COMPANY_ADMIN', 'STAFF']), updateIncome);
router.delete('/:id', requireRole(['COMPANY_ADMIN']), deleteIncome);
router.post('/merge', requireRole(['COMPANY_ADMIN']), mergeIncomes);

module.exports = router;
