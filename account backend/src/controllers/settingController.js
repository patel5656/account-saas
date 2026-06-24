const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get settings for the current user's company
exports.getSettings = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    let settings = await prisma.companySetting.findUnique({
      where: { companyId }
    });

    // If no settings exist yet, return a default object or create it on the fly
    if (!settings) {
      settings = await prisma.companySetting.create({
        data: { companyId }
      });
    }

    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ success: false, error: "Failed to fetch settings" });
  }
};

// Update settings
exports.updateSettings = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const updates = req.body;

    // Optional: Filter out properties that are not allowed to be updated directly
    delete updates.id;
    delete updates.companyId;

    const updatedSettings = await prisma.companySetting.upsert({
      where: { companyId },
      update: updates,
      create: {
        companyId,
        ...updates
      }
    });

    res.status(200).json({ success: true, data: updatedSettings });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ success: false, error: "Failed to update settings" });
  }
};
