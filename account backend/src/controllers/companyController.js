const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      include: { plan: true }
    });
    res.status(200).json({ success: true, data: companies });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createCompany = async (req, res) => {
  const { name, ownerEmail, ownerName, planId } = req.body;

  try {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email: ownerEmail } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already in use' });
    }

    const hashedPassword = await bcrypt.hash('password123', 10); // Default password

    // Use Prisma transaction to ensure both or neither are created
    const newCompany = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name,
          ownerName,
          ownerEmail,
          planId: planId ? parseInt(planId) : null,
        },
        include: { plan: true }
      });

      await tx.user.create({
        data: {
          name: ownerName,
          email: ownerEmail,
          password: hashedPassword,
          role: 'COMPANY_ADMIN',
          companyId: company.id
        }
      });

      return company;
    });

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: newCompany
    });
  } catch (error) {
    console.error('createCompany error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const company = await prisma.company.update({
      where: { id: parseInt(id) },
      data: { status }
    });
    res.status(200).json({ success: true, message: 'Status updated', data: company });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
