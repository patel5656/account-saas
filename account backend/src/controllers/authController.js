const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const tokenPayload = {
      id: user.id,
      role: user.role,
      companyId: user.companyId
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        companyId: user.companyId
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.impersonate = async (req, res) => {
  const { companyId } = req.body;

  try {
    // Only SUPERADMIN can hit this due to middleware
    const company = await prisma.company.findUnique({ where: { id: parseInt(companyId) } });
    
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    // Generate impersonated token
    const tokenPayload = {
      id: req.user.id, // Superadmin's original ID
      role: 'COMPANY_ADMIN', // Act as Company Admin
      companyId: company.id,
      impersonatorId: req.user.id // Track original identity for audit logs
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '2h' });

    res.status(200).json({
      success: true,
      token,
      company: { id: company.id, name: company.name }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
