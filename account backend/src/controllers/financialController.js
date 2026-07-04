const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getCollectionReport = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { startDate, endDate } = req.query;

    // Define date filters
    let dateFilter = {};
    if (startDate && endDate) {
      // Ensure the dates encompass the full day
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      dateFilter = {
        createdAt: {
          gte: start,
          lte: end
        }
      };
    }

    // Fetch all sales and purchases within the date range
    const invoices = await prisma.invoice.findMany({
      where: {
        companyId,
        date: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(new Date(endDate).setHours(23, 59, 59, 999)) : undefined
        }
      }
    });

    // We can also fetch actual payments from PaymentBook, but for now we calculate based on Invoices and Incomes/Expenses
    const incomes = await prisma.income.findMany({
      where: { companyId, ...dateFilter }
    });

    const expenses = await prisma.expense.findMany({
      where: { companyId, ...dateFilter }
    });

    // Aggregations
    let todaySales = 0;
    let cashSales = 0;
    let creditSales = 0;
    let purchases = 0;

    invoices.forEach(inv => {
      if (inv.type === 'SALES') {
        todaySales += inv.totalAmount;
        if (inv.paymentMode.toLowerCase() === 'cash') {
          cashSales += inv.totalAmount;
        } else {
          creditSales += inv.totalAmount;
        }
      } else if (inv.type === 'PURCHASE') {
        purchases += inv.totalAmount;
      }
    });

    // In a full system, Credit Recovery comes from PaymentBook where a customer pays off a debt
    // For this demonstration, we'll use a placeholder 0 or read from PaymentBook if it has amounts
    let creditRecovery = 0; 
    
    // Other Income
    // Assume Income model has an 'amount' field (Wait, the schema only has name/head. We will just use 0 for now)
    let otherIncome = 0;

    // Money In = Cash Sales + Credit Recovery + Other Income
    const moneyIn = {
      cashSale: cashSales,
      creditRecovery: creditRecovery,
      otherIncome: otherIncome,
      total: cashSales + creditRecovery + otherIncome
    };

    // Money Out = Purchases (Company Paid) + Expenses
    // Assume Expense model doesn't have amount either in current schema, defaulting to 0
    let companyPaid = purchases;
    let employeePaid = 0;
    let expensesPaid = 0;

    const moneyOut = {
      companyPaid: companyPaid,
      employeePaid: employeePaid,
      expensesPaid: expensesPaid,
      total: companyPaid + employeePaid + expensesPaid
    };

    const netCollection = moneyIn.total - moneyOut.total;

    // Calculate generic cash/bank balances from Bank model
    const banks = await prisma.bank.findMany({ where: { companyId } });
    let cashBalance = 0;
    let bankBalance = 0;
    banks.forEach(b => {
      if (b.type.toLowerCase() === 'cash') cashBalance += b.balance;
      else bankBalance += b.balance;
    });

    res.status(200).json({
      success: true,
      data: {
        todaySales,
        cashSales,
        creditSales,
        moneyIn,
        moneyOut,
        netCollection,
        accounts: {
          cash: cashBalance,
          bank: bankBalance
        }
      }
    });

  } catch (error) {
    console.error("Error generating collection report:", error);
    res.status(500).json({ success: false, error: "Failed to generate report" });
  }
};

exports.getDayBookSummary = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { dateType, date, withItems, voucherType } = req.query;

    let dateFilter = {};
    if (date) {
      const targetDate = new Date(date);
      // Ensure the date encompasses the full day
      const start = new Date(targetDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(targetDate);
      end.setHours(23, 59, 59, 999);

      if (dateType === 'Modified Date') {
        dateFilter = {
          updatedAt: {
            gte: start,
            lte: end
          }
        };
      } else {
        dateFilter = {
          date: {
            gte: start,
            lte: end
          }
        };
      }
    }

    const transactions = [];

    // Fetch Invoices
    if (!voucherType || ['SALES', 'PURCHASE', 'PURCHASE_RETURN', 'SALES_RETURN'].includes(voucherType)) {
      const invoices = await prisma.invoice.findMany({
        where: {
          companyId,
          ...dateFilter,
          ...(voucherType && { type: voucherType })
        },
        include: {
          customer: true,
          ...(withItems === 'true' && { items: { include: { product: true } } })
        }
      });

      invoices.forEach(inv => {
        let debit = 0;
        let paymentIn = 0;
        let paymentOut = 0;
        let discount = inv.totalDiscount || 0;

        if (inv.type === 'SALES' || inv.type === 'PURCHASE_RETURN') {
          if (inv.paymentMode && inv.paymentMode.toLowerCase() === 'cash') {
            paymentIn = inv.totalAmount;
          } else {
            debit = inv.totalAmount;
          }
        } else if (inv.type === 'PURCHASE' || inv.type === 'SALES_RETURN') {
          paymentOut = inv.totalAmount;
        }

        transactions.push({
          id: `inv_${inv.id}`,
          date: inv.date,
          voucherNo: inv.invoiceNo,
          particular: inv.customer ? inv.customer.name : 'Cash',
          voucherType: inv.type,
          debit,
          paymentIn,
          paymentOut,
          discount,
          items: inv.items
        });
      });
    }

    // Fetch Payment Book Transactions
    if (!voucherType || voucherType === 'PAYMENT' || voucherType === 'RECEIPT') {
      const paymentFilterDate = dateType === 'Modified Date' ? { updatedAt: dateFilter.updatedAt } : { date: dateFilter.date };
      
      const payments = await prisma.paymentBookTransaction.findMany({
        where: {
          companyId,
          ...paymentFilterDate
        },
        include: {
          paymentBook: true
        }
      });

      payments.forEach(pay => {
        let paymentType = pay.paymentIn > 0 ? 'RECEIPT' : 'PAYMENT';
        if (voucherType && voucherType !== paymentType) return;

        transactions.push({
          id: `pay_${pay.id}`,
          date: pay.date,
          voucherNo: '-',
          particular: pay.paymentBook ? pay.paymentBook.partyName : '-',
          voucherType: paymentType,
          debit: 0,
          paymentIn: pay.paymentIn || 0,
          paymentOut: pay.paymentOut || 0,
          discount: pay.discount || 0
        });
      });
    }

    // Fetch Expense Transactions
    if (!voucherType || voucherType === 'EXPENSE') {
      const expenseFilterDate = dateType === 'Modified Date' ? { updatedAt: dateFilter.updatedAt } : { date: dateFilter.date };
      
      const expenses = await prisma.expenseTransaction.findMany({
        where: {
          companyId,
          ...expenseFilterDate
        },
        include: {
          expense: true
        }
      });

      expenses.forEach(exp => {
        transactions.push({
          id: `exp_${exp.id}`,
          date: exp.date,
          voucherNo: '-',
          particular: exp.expense ? exp.expense.name : '-',
          voucherType: 'EXPENSE',
          debit: 0,
          paymentIn: 0,
          paymentOut: exp.paidAmount || 0,
          discount: exp.discount || 0
        });
      });
    }

    // Sort transactions by date descending
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error("Error generating day book summary:", error);
    res.status(500).json({ success: false, error: "Failed to fetch day book summary" });
  }
};

exports.getBrandwiseSale = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { startDate, endDate, customerId } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      dateFilter = {
        date: {
          gte: start,
          lte: end
        }
      };
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        companyId,
        type: 'SALES',
        ...dateFilter,
        ...(customerId && customerId !== 'all' && { customerId: parseInt(customerId, 10) })
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    const brandMap = {};

    invoices.forEach(inv => {
      inv.items.forEach(item => {
        const brandName = (item.product && item.product.brand) ? item.product.brand : 'Unbranded';
        
        if (!brandMap[brandName]) {
          brandMap[brandName] = {
            brandName,
            totalQuantity: 0,
            totalAmount: 0,
            totalDiscount: 0
          };
        }

        brandMap[brandName].totalQuantity += item.quantity || 0;
        brandMap[brandName].totalAmount += item.amount || 0;
        
        // Summing up discount1 and discount2 if they are flat amounts. 
        // If they are percentages, this would need adjusting based on how it's stored.
        // Assuming discount1 is a flat amount for now, or just fallback to 0.
        const d1 = parseFloat(item.discount1) || 0;
        const d2 = parseFloat(item.discount2) || 0;
        brandMap[brandName].totalDiscount += (d1 + d2);
      });
    });

    const reportData = Object.values(brandMap).sort((a, b) => a.brandName.localeCompare(b.brandName));

    res.status(200).json({
      success: true,
      data: reportData
    });

  } catch (error) {
    console.error("Error generating brandwise sale summary:", error);
    res.status(500).json({ success: false, error: "Failed to generate report" });
  }
};
