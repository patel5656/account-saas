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
  const { 
    name, sku, price, stock, mrp, barcode, category, brand, colorVariant, status,
    tax, hsnCode, purchasePrice, wholesalePrice, creditSalePrice, baseUnit, purchaseUnit, salesUnit,
    lowStockAlert, reorderLevel, enableBatch, enableExpiry, enableImei, hasBom, qtySlabs,
    openingStockRate, warehouse, bomName, isMultiLevel, bomRecipe,
    syncOnline, onlineProductName, onlineProductDesc, onlineSalePrice, ecommerceCategory, productImage
  } = req.body;
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
        tax: parseFloat(tax) || 0,
        hsnCode,
        purchasePrice: parseFloat(purchasePrice) || 0,
        wholesalePrice: parseFloat(wholesalePrice) || 0,
        creditSalePrice: parseFloat(creditSalePrice) || 0,
        baseUnit,
        purchaseUnit,
        salesUnit,
        lowStockAlert: parseInt(lowStockAlert, 10) || 0,
        reorderLevel: parseInt(reorderLevel, 10) || 0,
        enableBatch: Boolean(enableBatch),
        enableExpiry: Boolean(enableExpiry),
        enableImei: Boolean(enableImei),
        hasBom: Boolean(hasBom),
        qtySlabs: qtySlabs ? qtySlabs : undefined,
        openingStockRate: parseFloat(openingStockRate) || 0,
        warehouse,
        bomName,
        isMultiLevel: Boolean(isMultiLevel),
        bomRecipe: bomRecipe ? bomRecipe : undefined,
        syncOnline: Boolean(syncOnline),
        onlineProductName,
        onlineProductDesc,
        onlineSalePrice: parseFloat(onlineSalePrice) || 0,
        ecommerceCategory,
        productImage,
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
  const { 
    name, sku, price, stock, mrp, barcode, category, brand, colorVariant, status,
    tax, hsnCode, purchasePrice, wholesalePrice, creditSalePrice, baseUnit, purchaseUnit, salesUnit,
    lowStockAlert, reorderLevel, enableBatch, enableExpiry, enableImei, hasBom, qtySlabs,
    openingStockRate, warehouse, bomName, isMultiLevel, bomRecipe,
    syncOnline, onlineProductName, onlineProductDesc, onlineSalePrice, ecommerceCategory, productImage
  } = req.body;
  try {
    const existing = await prisma.product.findUnique({ where: { id: parseInt(id, 10) } });
    if (!existing || existing.companyId !== companyId) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const product = await prisma.product.update({
      where: { id: parseInt(id, 10) },
      data: {
        ...(name && { name }),
        ...(sku && { sku }),
        ...(barcode !== undefined && { barcode }),
        ...(category !== undefined && { category }),
        ...(brand !== undefined && { brand }),
        ...(colorVariant !== undefined && { colorVariant }),
        ...(status && { status }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(mrp !== undefined && { mrp: parseFloat(mrp) }),
        ...(stock !== undefined && { stock: parseInt(stock, 10) }),
        ...(tax !== undefined && { tax: parseFloat(tax) }),
        ...(hsnCode !== undefined && { hsnCode }),
        ...(purchasePrice !== undefined && { purchasePrice: parseFloat(purchasePrice) }),
        ...(wholesalePrice !== undefined && { wholesalePrice: parseFloat(wholesalePrice) }),
        ...(creditSalePrice !== undefined && { creditSalePrice: parseFloat(creditSalePrice) }),
        ...(baseUnit !== undefined && { baseUnit }),
        ...(purchaseUnit !== undefined && { purchaseUnit }),
        ...(salesUnit !== undefined && { salesUnit }),
        ...(lowStockAlert !== undefined && { lowStockAlert: parseInt(lowStockAlert, 10) }),
        ...(reorderLevel !== undefined && { reorderLevel: parseInt(reorderLevel, 10) }),
        ...(enableBatch !== undefined && { enableBatch: Boolean(enableBatch) }),
        ...(enableExpiry !== undefined && { enableExpiry: Boolean(enableExpiry) }),
        ...(enableImei !== undefined && { enableImei: Boolean(enableImei) }),
        ...(hasBom !== undefined && { hasBom: Boolean(hasBom) }),
        ...(qtySlabs !== undefined && { qtySlabs }),
        ...(openingStockRate !== undefined && { openingStockRate: parseFloat(openingStockRate) }),
        ...(warehouse !== undefined && { warehouse }),
        ...(bomName !== undefined && { bomName }),
        ...(isMultiLevel !== undefined && { isMultiLevel: Boolean(isMultiLevel) }),
        ...(bomRecipe !== undefined && { bomRecipe }),
        ...(syncOnline !== undefined && { syncOnline: Boolean(syncOnline) }),
        ...(onlineProductName !== undefined && { onlineProductName }),
        ...(onlineProductDesc !== undefined && { onlineProductDesc }),
        ...(onlineSalePrice !== undefined && { onlineSalePrice: parseFloat(onlineSalePrice) }),
        ...(ecommerceCategory !== undefined && { ecommerceCategory }),
        ...(productImage !== undefined && { productImage })
      }
    });
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
  const companyId = req.user.companyId;
  const { id } = req.params;
  try {
    const existing = await prisma.product.findUnique({ where: { id: parseInt(id, 10) } });
    if (!existing || existing.companyId !== companyId) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    await prisma.product.delete({
      where: { id: parseInt(id, 10) }
    });
    res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
