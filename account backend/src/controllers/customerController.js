const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all customers for the tenant
exports.getCustomers = async (req, res) => {
  const companyId = req.user.companyId;
  try {
    const customers = await prisma.customer.findMany({ where: { companyId } });
    res.status(200).json({ success: true, data: customers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create a new customer for the tenant
exports.createCustomer = async (req, res) => {
  const companyId = req.user.companyId;
  const { name, phone, address, gstin, mobile, partyTags, balance, status } = req.body;
  try {
    const customer = await prisma.customer.create({
      data: { 
        name, 
        phone, 
        address, 
        gstin, 
        mobile, 
        partyTags, 
        balance: balance ? parseFloat(balance) : 0, 
        status: status || 'Active',
        companyId 
      }
    });
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
