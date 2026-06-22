const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all banks for the tenant
exports.getBanks = async (req, res) => {
  const companyId = req.user.companyId;
  try {
    const banks = await prisma.bank.findMany({
      where: { companyId }
    });
    res.status(200).json({ success: true, data: banks });
  } catch (error) {
    console.error('Error fetching banks:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Create a new bank account
exports.createBank = async (req, res) => {
  const companyId = req.user.companyId;
  const { name, type, balance, address, branch, ifsc, accountNo } = req.body;
  try {
    const bank = await prisma.bank.create({
      data: {
        name,
        type,
        balance: parseFloat(balance) || 0,
        address: address || null,
        branch: branch || null,
        ifsc: ifsc || null,
        accountNo: accountNo || null,
        companyId
      }
    });
    res.status(201).json({ success: true, data: bank });
  } catch (error) {
    console.error('Error creating bank:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update an existing bank account
exports.updateBank = async (req, res) => {
  const companyId = req.user.companyId;
  const { id } = req.params;
  const { name, type, address, branch, ifsc, accountNo, balance } = req.body;
  try {
    const bank = await prisma.bank.update({
      where: { id: parseInt(id, 10), companyId },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(address !== undefined && { address }),
        ...(branch !== undefined && { branch }),
        ...(ifsc !== undefined && { ifsc }),
        ...(accountNo !== undefined && { accountNo }),
        ...(balance !== undefined && { balance: parseFloat(balance) })
      }
    });
    res.status(200).json({ success: true, data: bank });
  } catch (error) {
    console.error('Error updating bank:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete a bank account
exports.deleteBank = async (req, res) => {
  const companyId = req.user.companyId;
  const { id } = req.params;
  try {
    await prisma.bank.delete({
      where: { id: parseInt(id, 10), companyId }
    });
    res.status(200).json({ success: true, message: 'Bank account deleted successfully' });
  } catch (error) {
    console.error('Error deleting bank:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Merge bank accounts (Ledger merger flow)
exports.mergeBanks = async (req, res) => {
  const companyId = req.user.companyId;
  const { sourceBankId, targetBankId } = req.body;

  if (parseInt(sourceBankId, 10) === parseInt(targetBankId, 10)) {
    return res.status(400).json({ success: false, message: 'Source and target bank accounts must be different' });
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Find source and target accounts
      const source = await tx.bank.findFirstOrThrow({
        where: { id: parseInt(sourceBankId, 10), companyId }
      });
      const target = await tx.bank.findFirstOrThrow({
        where: { id: parseInt(targetBankId, 10), companyId }
      });

      // Sum balance
      const newBalance = target.balance + source.balance;

      // Update target balance
      await tx.bank.update({
        where: { id: target.id },
        data: { balance: newBalance }
      });

      // Delete source account
      await tx.bank.delete({
        where: { id: source.id }
      });
    });

    res.status(200).json({ success: true, message: 'Bank accounts merged successfully' });
  } catch (error) {
    console.error('Error merging banks:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
