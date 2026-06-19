const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getMetrics = async (req, res) => {
  try {
    const { role, companyId } = req.user;

    if (role === 'SUPERADMIN') {
      const activeCompanies = await prisma.company.count({ where: { status: 'ACTIVE' } });
      const activeSubscriptions = await prisma.company.count({ where: { status: 'ACTIVE', planId: { not: null } } });
      const inactiveSubscriptions = await prisma.company.count({ where: { status: { not: 'ACTIVE' } } });

      // Calculate real MRR from plan prices
      const companiesWithPlans = await prisma.company.findMany({
        where: { status: 'ACTIVE', planId: { not: null } },
        include: { plan: true }
      });
      const mrr = companiesWithPlans.reduce((sum, c) => sum + (c.plan?.price || 0), 0);

      return res.status(200).json({
        success: true,
        data: {
          totalActiveCompanies: activeCompanies,
          mrr,
          activeSubscriptions,
          inactiveSubscriptions
        }
      });
    }

    // Tenant Metrics
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID is required for tenant metrics' });
    }

    const totalCustomers = await prisma.customer.count({ where: { companyId } });
    const totalProducts = await prisma.product.count({ where: { companyId } });
    const totalInvoicesCount = await prisma.invoice.count({ where: { companyId } });
    
    // Calculate total sales
    const invoices = await prisma.invoice.findMany({ where: { companyId }, select: { totalAmount: true } });
    const totalSales = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    res.status(200).json({
      success: true,
      data: {
        totalCustomers,
        totalProducts,
        totalInvoices: totalInvoicesCount,
        totalSales
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
