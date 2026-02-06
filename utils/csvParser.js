const csv = require('csv-parser');
const fs = require('fs');
const Product = require('../models/Product');
const Visit = require('../models/Visit');
const Doctor = require('../models/Doctor');
const User = require('../models/User');

/**
 * Parse CSV file from MARG ERP and import sales data
 * Expected CSV format (example):
 * Date,MR_Code,Doctor_Code,Product_Code,Quantity,Amount
 * 2024-01-15,MR001,DR001,PRD001,10,5000
 */
const parseMargERPCSV = async (filePath, options = {}) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const errors = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        results.push(row);
      })
      .on('end', async () => {
        try {
          const importResults = await processSalesData(results, options);
          resolve(importResults);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

/**
 * Process sales data from CSV
 */
const processSalesData = async (rows, options) => {
  const stats = {
    total: rows.length,
    processed: 0,
    created: 0,
    updated: 0,
    errors: 0,
    errorDetails: [],
  };

  for (const row of rows) {
    try {
      // Map CSV columns (adjust based on actual MARG ERP format)
      const date = row.Date || row.date || row.DATE;
      const mrCode = row.MR_Code || row.mr_code || row.MR_CODE || row.employeeId;
      const doctorCode = row.Doctor_Code || row.doctor_code || row.DOCTOR_CODE;
      const productCode = row.Product_Code || row.product_code || row.PRODUCT_CODE;
      const quantity = parseInt(row.Quantity || row.quantity || row.QUANTITY || 0);
      const amount = parseFloat(row.Amount || row.amount || row.AMOUNT || 0);

      // Validate required fields
      if (!date || !mrCode || !doctorCode || !productCode || !quantity) {
        stats.errors++;
        stats.errorDetails.push({
          row,
          error: 'Missing required fields',
        });
        continue;
      }

      // Find MR by employee code
      const mr = await User.findOne({ employeeId: mrCode, role: 'MR' });
      if (!mr) {
        stats.errors++;
        stats.errorDetails.push({
          row,
          error: `MR not found with code: ${mrCode}`,
        });
        continue;
      }

      // Find Doctor (you may need to add a code field to Doctor model)
      // For now, assuming doctorCode maps to registrationNumber or name
      const doctor = await Doctor.findOne({
        $or: [
          { registrationNumber: doctorCode },
          { name: new RegExp(doctorCode, 'i') },
        ],
      });
      if (!doctor) {
        stats.errors++;
        stats.errorDetails.push({
          row,
          error: `Doctor not found with code: ${doctorCode}`,
        });
        continue;
      }

      // Find Product
      const product = await Product.findOne({ code: productCode });
      if (!product) {
        stats.errors++;
        stats.errorDetails.push({
          row,
          error: `Product not found with code: ${productCode}`,
        });
        continue;
      }

      // Create or update visit
      const visitDate = new Date(date);
      const unitPrice = amount / quantity;

      // Check if visit already exists for this date, MR, and Doctor
      let visit = await Visit.findOne({
        mrId: mr._id,
        doctorId: doctor._id,
        visitDate: {
          $gte: new Date(visitDate.setHours(0, 0, 0, 0)),
          $lt: new Date(visitDate.setHours(23, 59, 59, 999)),
        },
      });

      if (visit) {
        // Update existing visit - add order
        const existingOrder = visit.orders.find(
          (o) => o.productId.toString() === product._id.toString()
        );

        if (existingOrder) {
          existingOrder.quantity += quantity;
          existingOrder.unitPrice = unitPrice;
        } else {
          visit.orders.push({
            productId: product._id,
            quantity,
            unitPrice,
          });
        }

        await visit.save();
        stats.updated++;
      } else {
        // Create new visit
        visit = await Visit.create({
          mrId: mr._id,
          doctorId: doctor._id,
          visitDate: new Date(date),
          visitTime: new Date(date),
          purpose: 'Order Collection',
          orders: [
            {
              productId: product._id,
              quantity,
              unitPrice,
            },
          ],
          status: 'Completed',
        });
        stats.created++;
      }

      stats.processed++;
    } catch (error) {
      stats.errors++;
      stats.errorDetails.push({
        row,
        error: error.message,
      });
    }
  }

  return stats;
};

module.exports = {
  parseMargERPCSV,
  processSalesData,
};
