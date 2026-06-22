const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all incomes for the tenant
exports.getIncomes = async (req, res) => {
  const companyId = req.user.companyId;
  try {
    const incomes = await prisma.income.findMany({
      where: { companyId }
    });
    res.status(200).json({ success: true, data: incomes });
  } catch (error) {
    console.error('Error fetching incomes:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Create a new income
exports.createIncome = async (req, res) => {
  const companyId = req.user.companyId;
  const { name, head, isActive } = req.body;
  try {
    const income = await prisma.income.create({
      data: {
        name,
        head: head || null,
        isActive: isActive !== false,
        companyId
      }
    });
    res.status(201).json({ success: true, data: income });
  } catch (error) {
    console.error('Error creating income:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update an existing income
exports.updateIncome = async (req, res) => {
  const companyId = req.user.companyId;
  const { id } = req.params;
  const { name, head, isActive } = req.body;
  try {
    const income = await prisma.income.update({
      where: { id: parseInt(id, 10), companyId },
      data: {
        ...(name && { name }),
        ...(head !== undefined && { head }),
        ...(isActive !== undefined && { isActive })
      }
    });
    res.status(200).json({ success: true, data: income });
  } catch (error) {
    console.error('Error updating income:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete an income
exports.deleteIncome = async (req, res) => {
  const companyId = req.user.companyId;
  const { id } = req.params;
  try {
    await prisma.income.delete({
      where: { id: parseInt(id, 10), companyId }
    });
    res.status(200).json({ success: true, message: 'Income deleted successfully' });
  } catch (error) {
    console.error('Error deleting income:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Merge incomes (delete source, keep target)
exports.mergeIncomes = async (req, res) => {
  const companyId = req.user.companyId;
  const { sourceIncomeId, targetIncomeId } = req.body;

  if (parseInt(sourceIncomeId, 10) === parseInt(targetIncomeId, 10)) {
    return res.status(400).json({ success: false, message: 'Source and target incomes must be different' });
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Find source and target
      const source = await tx.income.findFirstOrThrow({
        where: { id: parseInt(sourceIncomeId, 10), companyId }
      });
      const target = await tx.income.findFirstOrThrow({
        where: { id: parseInt(targetIncomeId, 10), companyId }
      });

      // Transfer logic if records were referenced. For now, delete source.
      await tx.income.delete({
        where: { id: source.id }
      });
    });

    res.status(200).json({ success: true, message: 'Incomes merged successfully' });
  } catch (error) {
    console.error('Error merging incomes:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
