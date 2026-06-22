const express = require('express');
const router = express.Router();
const { getExpenses, createExpense, updateExpense, deleteExpense, mergeExpenses } = require('../controllers/expenseController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/', getExpenses);
router.post('/', requireRole(['COMPANY_ADMIN', 'STAFF']), createExpense);
router.put('/:id', requireRole(['COMPANY_ADMIN', 'STAFF']), updateExpense);
router.delete('/:id', requireRole(['COMPANY_ADMIN']), deleteExpense);
router.post('/merge', requireRole(['COMPANY_ADMIN']), mergeExpenses);

module.exports = router;
