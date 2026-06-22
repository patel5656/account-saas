const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all employees for the tenant
exports.getEmployees = async (req, res) => {
  const companyId = req.user.companyId;
  try {
    const employees = await prisma.employee.findMany({
      where: { companyId }
    });
    res.status(200).json({ success: true, data: employees });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Create a new employee
exports.createEmployee = async (req, res) => {
  const companyId = req.user.companyId;
  const { 
    name, mobile, city, joiningDate, designation, salary, 
    paidHoliday, commission, specialCommission, totalSaleCommission, 
    commissionOnManufacturing 
  } = req.body;
  try {
    const employee = await prisma.employee.create({
      data: {
        name,
        mobile: mobile || null,
        city: city || null,
        joiningDate: joiningDate || null,
        designation: designation || null,
        salary: parseFloat(salary) || 0,
        paidHoliday: parseInt(paidHoliday, 10) || 0,
        commission: parseFloat(commission) || 0,
        specialCommission: parseFloat(specialCommission) || 0,
        totalSaleCommission: parseFloat(totalSaleCommission) || 0,
        commissionOnManufacturing: parseFloat(commissionOnManufacturing) || 0,
        companyId
      }
    });
    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update employee details
exports.updateEmployee = async (req, res) => {
  const companyId = req.user.companyId;
  const { id } = req.params;
  const { 
    name, mobile, city, joiningDate, designation, salary, 
    paidHoliday, commission, specialCommission, totalSaleCommission, 
    commissionOnManufacturing 
  } = req.body;
  try {
    const employee = await prisma.employee.update({
      where: { id: parseInt(id, 10), companyId },
      data: {
        ...(name && { name }),
        ...(mobile !== undefined && { mobile }),
        ...(city !== undefined && { city }),
        ...(joiningDate !== undefined && { joiningDate }),
        ...(designation !== undefined && { designation }),
        ...(salary !== undefined && { salary: parseFloat(salary) }),
        ...(paidHoliday !== undefined && { paidHoliday: parseInt(paidHoliday, 10) }),
        ...(commission !== undefined && { commission: parseFloat(commission) }),
        ...(specialCommission !== undefined && { specialCommission: parseFloat(specialCommission) }),
        ...(totalSaleCommission !== undefined && { totalSaleCommission: parseFloat(totalSaleCommission) }),
        ...(commissionOnManufacturing !== undefined && { commissionOnManufacturing: parseFloat(commissionOnManufacturing) })
      }
    });
    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete employee
exports.deleteEmployee = async (req, res) => {
  const companyId = req.user.companyId;
  const { id } = req.params;
  try {
    await prisma.employee.delete({
      where: { id: parseInt(id, 10), companyId }
    });
    res.status(200).json({ success: true, message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
