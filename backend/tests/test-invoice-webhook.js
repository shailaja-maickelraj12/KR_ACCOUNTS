import fetch from "node-fetch";

const API_URL = "http://localhost:6400/ams/external/invoices/webhook";
const API_KEY = "sales_module_secret_key_2026";

const sampleInvoicePayload = {
  invoice: {
    id: 122,
    invoiceNo: "122",
    invoiceDate: "2026-08-24",
    invoiceType: "GST WASTE SALE INVOICE",
    buyer: {
      supplierId: 125,
      accountName: "BALAJI TRADERS",
      code: "00000125",
      address1: "123 Main St",
      address2: "Coimbatore",
      gstin: "33BBBBB1111B1Z2",
      mobileNo: "9876543210"
    },
    salesOrder: {
      salesOrderId: 122,
      orderNo: "122",
      orderDate: "2026-08-20",
      wasteLot: "3",
      rate: 150.00
    },
    financials: {
      assessableValue: 1600800.00,
      subTotal: 1600800.00,
      gstAmount: 288144.00,
      igstAmount: 0.00,
      tcsPercent: 0.10,
      tcsRs: 1600.80,
      roundOff: 0.20,
      invoiceValue: 1888944.00
    },
    dispatchDetails: {
      transport: "VETRI TRANSPORT",
      lrNo: "LR-9988",
      lrDate: "2026-08-24",
      vehicleNo: "TN 34 Q 3688",
      ewayBillNo: "5720 6024 4707"
    }
  }
};

async function testInvoiceWebhook() {
  console.log("🚀 Testing Invoice Webhook Integration...");
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": API_KEY
      },
      body: JSON.stringify(sampleInvoicePayload)
    });

    const result = await response.json();
    console.log(`Status Code: ${response.status}`);
    console.log("Response Payload:", JSON.stringify(result, null, 2));

    if (result.success) {
      console.log("✅ SUCCESS: Invoice transformed and saved as Journal Voucher!");
    } else {
      console.error("❌ FAILED:", result.message);
    }
  } catch (error) {
    console.error("❌ Error running test:", error.message);
  }
}

testInvoiceWebhook();
