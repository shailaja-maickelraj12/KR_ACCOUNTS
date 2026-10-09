import dotenv from "dotenv";
dotenv.config({ path: "./backend/.env" });
import { processInvoiceToJV } from "../services/invoiceService.js";
import { Voucher, sequelize } from "../models/index.js";

const sampleInvoice = {
  id: 122,
  invoiceNo: "122",
  invoiceDate: "2026-08-24",
  invoiceType: "GST WASTE SALE INVOICE",
  buyer: {
    supplierId: 125,
    accountName: "BALAJI TRADERS",
    code: "00000125",
    gstin: "33BBBBB1111B1Z2"
  },
  salesOrder: {
    salesOrderId: 122,
    orderNo: "122",
    wasteLot: "3"
  },
  financials: {
    subTotal: 1600800.00,
    gstAmount: 288144.00,
    tcsPercent: 0.10,
    tcsRs: 1600.80,
    roundOff: 0.20,
    invoiceValue: 1888944.00
  },
  dispatchDetails: {
    ewayBillNo: "5720 6024 4707"
  }
};

async function testService() {
  console.log("⚡ Connecting to Database and Testing invoiceService...");
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const result = await processInvoiceToJV(sampleInvoice);
    console.log("Result:", JSON.stringify(result, null, 2));

    if (result.success && result.voucher) {
      console.log("🎉 VERIFICATION PASSED!");
      console.log(`Voucher No: ${result.voucher.voucherNo}`);
      console.log(`Total Amount: ₹${result.voucher.totalAmount}`);
      console.log("Line Items:");
      result.voucher.items.forEach((item, index) => {
        console.log(`  [${index + 1}] ${item.accountName} (${item.accountCode}): Dr ₹${item.debit || 0} | Cr ₹${item.credit || 0}`);
      });
    }
  } catch (error) {
    console.error("❌ Verification Failed:", error);
  } finally {
    await sequelize.close();
  }
}

testService();
