const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all products for the tenant
exports.getProducts = async (req, res) => {
  const companyId = req.user.companyId;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  try {
    const [products, total] = await Promise.all([
      prisma.product.findMany({ where: { companyId }, skip, take: limit }),
      prisma.product.count({ where: { companyId } })
    ]);
    res.status(200).json({ success: true, data: products, meta: { total, page, limit } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create a new product for the tenant
exports.createProduct = async (req, res) => {
  const companyId = req.user.companyId;
  const { name, sku, price, stock, mrp, barcode, category, brand, colorVariant, status } = req.body;
  try {
    const product = await prisma.product.create({
      data: { 
        name, 
        sku, 
        barcode,
        price: parseFloat(price) || 0, 
        mrp: parseFloat(mrp) || 0,
        category,
        brand,
        colorVariant,
        status: status || 'Active',
        stock: parseInt(stock, 10) || 0, 
        companyId 
      }
    });
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'SKU already exists for this company' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update a product (e.g., stock adjustments)
exports.updateProduct = async (req, res) => {
  const companyId = req.user.companyId;
  const { id } = req.params;
  const { name, sku, price, stock, mrp, barcode, category, brand, colorVariant, status } = req.body;
  try {
    const product = await prisma.product.update({
      where: { id: parseInt(id, 10), companyId },
      data: {
        ...(name && { name }),
        ...(sku && { sku }),
        ...(barcode && { barcode }),
        ...(category && { category }),
        ...(brand && { brand }),
        ...(colorVariant && { colorVariant }),
        ...(status && { status }),
        ...(price && { price: parseFloat(price) }),
        ...(mrp && { mrp: parseFloat(mrp) }),
        ...(stock !== undefined && { stock: parseInt(stock, 10) })
      }
    });
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
