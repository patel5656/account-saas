const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all expenses for the tenant
exports.getExpenses = async (req, res) => {
  const companyId = req.user.companyId;
  try {
    const expenses = await prisma.expense.findMany({
      where: { companyId }
    });
    res.status(200).json({ success: true, data: expenses });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Create a new expense
exports.createExpense = async (req, res) => {
  const companyId = req.user.companyId;
  const { name, head, type, isActive } = req.body;
  try {
    const expense = await prisma.expense.create({
      data: {
        name,
        head,
        type,
        isActive: isActive !== false,
        companyId
      }
    });
    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update an existing expense
exports.updateExpense = async (req, res) => {
  const companyId = req.user.companyId;
  const { id } = req.params;
  const { name, head, type, isActive } = req.body;
  try {
    const expense = await prisma.expense.update({
      where: { id: parseInt(id, 10), companyId },
      data: {
        ...(name && { name }),
        ...(head !== undefined && { head }),
        ...(type !== undefined && { type }),
        ...(isActive !== undefined && { isActive })
      }
    });
    res.status(200).json({ success: true, data: expense });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete an expense
exports.deleteExpense = async (req, res) => {
  const companyId = req.user.companyId;
  const { id } = req.params;
  try {
    await prisma.expense.delete({
      where: { id: parseInt(id, 10), companyId }
    });
    res.status(200).json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Merge expenses (delete source, keep target)
exports.mergeExpenses = async (req, res) => {
  const companyId = req.user.companyId;
  const { sourceExpenseId, targetExpenseId } = req.body;

  if (parseInt(sourceExpenseId, 10) === parseInt(targetExpenseId, 10)) {
    return res.status(400).json({ success: false, message: 'Source and target expenses must be different' });
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Find source and target
      const source = await tx.expense.findFirstOrThrow({
        where: { id: parseInt(sourceExpenseId, 10), companyId }
      });
      const target = await tx.expense.findFirstOrThrow({
        where: { id: parseInt(targetExpenseId, 10), companyId }
      });

      // Here you would transfer transaction records from source to target when transactions are implemented.
      // Currently, we'll just delete the source.
      await tx.expense.delete({
        where: { id: source.id }
      });
    });

    res.status(200).json({ success: true, message: 'Expenses merged successfully' });
  } catch (error) {
    console.error('Error merging expenses:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
