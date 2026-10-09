# 📄 Invoice Details API Documentation
### For External Sales Module Integration

This document describes the RESTful API endpoints available for the Sales Module to fetch invoice details from the Raw Material ERP system.

---

## 🔒 Authentication

All requests require an **API Key**. Send the key in the request header `X-API-KEY` (or as a query parameter `?apiKey=...`).

* **Header Name**: `X-API-KEY`
* **Default Secret Key**: `sales_module_secret_key_2026`

> If missing or invalid, the server responds with `401 Unauthorized`.

---

## 📡 Base URLs

* **Production Server**: `https://krexports.org/api/v1/external/invoices`
* **Local Development**: `http://localhost:5000/api/v1/external/invoices`

---

## 📑 Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Query & search invoices list (with pagination & filters) |
| `GET` | `/:id` | Fetch single invoice details by Database ID or Invoice Number |

---

## 1️⃣ Get Single Invoice Details

Fetch complete invoice header, buyer details, financial calculations, dispatch info, and bale item list for a single invoice.

* **HTTP Method**: `GET`
* **URL Path**: `/:id` (where `:id` can be the Database ID like `122` or the Invoice Number string like `"122"`)

### Example Request (cURL)
```bash
curl -X GET "https://krexports.org/api/v1/external/invoices/122" \
     -H "X-API-KEY: sales_module_secret_key_2026"
```

### Example Response (`200 OK`)
```json
{
  "success": true,
  "message": "Invoice details retrieved successfully",
  "invoice": {
    "id": 122,
    "invoiceNo": "122",
    "invoiceDate": "2026-08-24",
    "invoiceType": "GST WASTE SALE INVOICE",
    "buyer": {
      "supplierId": 125,
      "accountName": "BALAJI TRADERS",
      "code": "00000125",
      "address1": "123 Main St",
      "address2": "Coimbatore",
      "gstin": "33BBBBB1111B1Z2",
      "mobileNo": "9876543210"
    },
    "salesOrder": {
      "salesOrderId": 122,
      "orderNo": "122",
      "orderDate": "2026-08-20",
      "wasteLot": "3",
      "rate": 150.00
    },
    "financials": {
      "assessableValue": 1600800.00,
      "charity": 0.00,
      "vatTax": 0.00,
      "cenvat": 0.00,
      "duty": 0.00,
      "cess": 0.00,
      "hsCess": 0.00,
      "subTotal": 1600800.00,
      "gstAmount": 288144.00,
      "igstAmount": 0.00,
      "tcsPercent": 0.10,
      "tcsRs": 1600.80,
      "pfCharges": 0.00,
      "roundOff": 0.20,
      "invoiceValue": 1888944.00,
      "creditDays": 30,
      "interestPercent": 18.00
    },
    "dispatchDetails": {
      "transport": "VETRI TRANSPORT",
      "lrNo": "LR-9988",
      "lrDate": "2026-08-24",
      "vehicleNo": "TN 34 Q 3688",
      "removalTime": "12:00 PM",
      "ewayBillNo": "5720 6024 4707",
      "exportTo": "Local Sale",
      "approve": true
    },
    "summary": {
      "totalBales": 1,
      "totalNetWeight": 1.00
    },
    "items": [
      {
        "id": 4417,
        "baleNo": "WC-122-109-001",
        "lotNo": "109",
        "wasteName": "USED R/F MACHINE LR6 S 1104",
        "grossWt": 1.00,
        "tareWt": 0.00,
        "netWt": 1.00
      }
    ]
  }
}
```

---

## 2️⃣ Query & Filter Invoices List

Retrieve multiple invoices with search filters and pagination.

* **HTTP Method**: `GET`
* **URL Path**: `/`

### Query Parameters

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `invoiceNo` | `string` | No | Search by invoice number substring | `invoiceNo=102` |
| `startDate` | `string` | No | Filter date onwards (`YYYY-MM-DD`) | `startDate=2026-08-01` |
| `endDate` | `string` | No | Filter date up to (`YYYY-MM-DD`) | `endDate=2026-08-31` |
| `supplierId` | `number` | No | Filter by buyer/supplier ID | `supplierId=125` |
| `salesOrderId`| `number` | No | Filter by linked sales order ID | `salesOrderId=102` |
| `page` | `number` | No | Page number (default: `1`) | `page=1` |
| `limit` | `number` | No | Items per page (default: `50`, max: `500`) | `limit=20` |

### Example Request
```http
GET /api/v1/external/invoices?startDate=2026-08-01&endDate=2026-08-31&page=1&limit=10 HTTP/1.1
Host: krexports.org
X-API-KEY: sales_module_secret_key_2026
```

### Example Response (`200 OK`)
```json
{
  "success": true,
  "message": "Invoices list retrieved successfully",
  "data": {
    "totalCount": 14,
    "totalPages": 2,
    "currentPage": 1,
    "limit": 10,
    "invoices": [
      {
        "id": 122,
        "invoiceNo": "122",
        "invoiceDate": "2026-08-24",
        "invoiceType": "GST WASTE SALE INVOICE",
        "buyer": { ... },
        "financials": { ... },
        "summary": { ... },
        "items": [ ... ]
      }
    ]
  }
}
```

---

## ⚠️ Error Handling & Status Codes

| HTTP Code | Message | Description |
| :--- | :--- | :--- |
| `401 Unauthorized` | `"Unauthorized access. Provide a valid Bearer token or X-API-KEY header."` | Missing or invalid `X-API-KEY` |
| `404 Not Found` | `"Invoice '999' not found"` | Requested invoice ID does not exist |
| `400 Bad Request` | `"Invalid query parameters"` | Malformed request or database query error |

---

## 💻 Integration Code Snippet (JavaScript / Node.js)

```javascript
const axios = require('axios');

async function getInvoiceDetails(invoiceId) {
  try {
    const response = await axios.get(`https://krexports.org/api/v1/external/invoices/${invoiceId}`, {
      headers: {
        'X-API-KEY': 'sales_module_secret_key_2026'
      }
    });

    if (response.data.success) {
      console.log('Invoice Details:', response.data.invoice);
      return response.data.invoice;
    }
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
  }
}

// Fetch Invoice #102
getInvoiceDetails(102);
```
