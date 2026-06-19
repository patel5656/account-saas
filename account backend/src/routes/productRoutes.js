const express = require('express');
const router = express.Router();
const { getProducts, createProduct, updateProduct } = require('../controllers/productController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/', getProducts);
router.post('/', requireRole(['COMPANY_ADMIN', 'SUPERADMIN']), createProduct);
router.put('/:id', requireRole(['COMPANY_ADMIN', 'SUPERADMIN']), updateProduct);

module.exports = router;
