const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all payment books for the tenant
exports.getPaymentBooks = async (req, res) => {
  const companyId = req.user.companyId;
  try {
    const paymentBooks = await prisma.paymentBook.findMany({
      where: { companyId }
    });
    res.status(200).json({ success: true, data: paymentBooks });
  } catch (error) {
    console.error('Error fetching payment books:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Create a new payment book entry
exports.createPaymentBook = async (req, res) => {
  const companyId = req.user.companyId;
  const { partyName, mobileNumber, city, isActive } = req.body;
  try {
    const paymentBook = await prisma.paymentBook.create({
      data: {
        partyName,
        mobileNumber: mobileNumber || null,
        city: city || null,
        isActive: isActive !== false,
        companyId
      }
    });
    res.status(201).json({ success: true, data: paymentBook });
  } catch (error) {
    console.error('Error creating payment book:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update an existing payment book entry
exports.updatePaymentBook = async (req, res) => {
  const companyId = req.user.companyId;
  const { id } = req.params;
  const { partyName, mobileNumber, city, isActive } = req.body;
  try {
    const paymentBook = await prisma.paymentBook.update({
      where: { id: parseInt(id, 10), companyId },
      data: {
        ...(partyName && { partyName }),
        ...(mobileNumber !== undefined && { mobileNumber }),
        ...(city !== undefined && { city }),
        ...(isActive !== undefined && { isActive })
      }
    });
    res.status(200).json({ success: true, data: paymentBook });
  } catch (error) {
    console.error('Error updating payment book:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete a payment book entry
exports.deletePaymentBook = async (req, res) => {
  const companyId = req.user.companyId;
  const { id } = req.params;
  try {
    await prisma.paymentBook.delete({
      where: { id: parseInt(id, 10), companyId }
    });
    res.status(200).json({ success: true, message: 'Payment book entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment book:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Merge payment books (delete source, keep target)
exports.mergePaymentBooks = async (req, res) => {
  const companyId = req.user.companyId;
  const { sourcePaymentBookId, targetPaymentBookId } = req.body;

  if (parseInt(sourcePaymentBookId, 10) === parseInt(targetPaymentBookId, 10)) {
    return res.status(400).json({ success: false, message: 'Source and target entries must be different' });
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Find source and target
      const source = await tx.paymentBook.findFirstOrThrow({
        where: { id: parseInt(sourcePaymentBookId, 10), companyId }
      });
      const target = await tx.paymentBook.findFirstOrThrow({
        where: { id: parseInt(targetPaymentBookId, 10), companyId }
      });

      // Transfer logic if records were referenced. For now, delete source.
      await tx.paymentBook.delete({
        where: { id: source.id }
      });
    });

    res.status(200).json({ success: true, message: 'Payment book entries merged successfully' });
  } catch (error) {
    console.error('Error merging payment books:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
