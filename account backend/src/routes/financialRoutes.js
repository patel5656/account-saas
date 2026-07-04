const express = require('express');
const router = express.Router();
const financialController = require('../controllers/financialController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/collections', financialController.getCollectionReport);
router.get('/day-book-summary', financialController.getDayBookSummary);
router.get('/brandwise-sale', financialController.getBrandwiseSale);

module.exports = router;
