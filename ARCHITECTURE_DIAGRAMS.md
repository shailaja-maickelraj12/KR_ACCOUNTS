# KR Accounts ERP — System Architecture & Workflows (Black & White)

This document provides complete, high-fidelity architectural documentation and Black & White (B&W) diagrams for the **Mill Accounts Management System (KR Accounts ERP)**.

---

## 1. Backend Folder & Architectural Flowchart (Black & White)

```mermaid
%%{init: {'theme': 'neutral', 'themeVariables': { 'primaryColor': '#ffffff', 'primaryBorderColor': '#000000', 'primaryTextColor': '#000000', 'lineColor': '#000000', 'secondaryColor': '#f5f5f5', 'tertiaryColor': '#ffffff', 'clusterBkg': '#ffffff', 'clusterBorder': '#000000' }}}%%
flowchart TD
    subgraph BF["Backend Folder Structure"]
        direction TB
        B_ROOT["backend/"]
        B_SRV["server.js (Express Entrypoint)"]
        B_CFG["config/ database.js (Sequelize SQLite/MySQL)"]
        B_RT["routes/ (api.routes, voucherRoutes, masterRoutes, reportRoutes, etc.)"]
        B_CTRL["controllers/ (voucherController, masterController, reportController, etc.)"]
        B_SRVC["services/ (voucherService, accountService, reportService, tallyService, invoiceService)"]
        B_MDL["models/ (Voucher, VoucherItem, Account, Group, SubGroup, TDSMaster, AuditLog, etc.)"]
        B_MW["middleware/ (authMiddleware, logger, validate)"]
        B_UTL["utils/ (exportExcel, formulaEvaluator, reportGenerator)"]

        B_ROOT --> B_SRV
        B_ROOT --> B_CFG
        B_ROOT --> B_RT
        B_ROOT --> B_CTRL
        B_ROOT --> B_SRVC
        B_ROOT --> B_MDL
        B_ROOT --> B_MW
        B_ROOT --> B_UTL
    end

    subgraph BA["Backend Architecture Pipeline"]
        direction TB
        REQ["Client HTTP Request (JSON REST API)"]
        EX_SRV["Express Server Engine (:6400 / :5000)"]
        MW_PIPE["Middleware Pipeline (CORS, Body Parser, Auth Token / API-Key)"]
        RTR["API Route Router (api.routes.js)"]
        CTRL_L["Controller Layer (Input Validation, Status Handling)"]
        SRV_L["Business Logic Layer (Double-Entry Validation, Batching, Audit)"]
        ORM_L["Sequelize ORM Layer (Models, Schemas, Transactions)"]
        DB_ST[("Persistent Database (SQLite / MySQL)")]
        TALLY_EXT["External Service: Tally Prime ERP (:9000 XML)"]
        SALES_EXT["External Service: Sales Invoice Webhook / Sync"]

        REQ --> EX_SRV
        EX_SRV --> MW_PIPE
        MW_PIPE --> RTR
        RTR --> CTRL_L
        CTRL_L --> SRV_L
        SRV_L --> ORM_L
        ORM_L --> DB_ST
        SRV_L -.-> TALLY_EXT
        SRV_L -.-> SALES_EXT
    end

    B_SRV -.-> EX_SRV
    B_RT -.-> RTR
    B_CTRL -.-> CTRL_L
    B_SRVC -.-> SRV_L
    B_MDL -.-> ORM_L
```

---

## 2. Frontend Folder & Module Architecture (Black & White)

```mermaid
%%{init: {'theme': 'neutral', 'themeVariables': { 'primaryColor': '#ffffff', 'primaryBorderColor': '#000000', 'primaryTextColor': '#000000', 'lineColor': '#000000', 'secondaryColor': '#f5f5f5', 'tertiaryColor': '#ffffff', 'clusterBkg': '#ffffff', 'clusterBorder': '#000000' }}}%%
flowchart TD
    subgraph FF["Frontend Folder Structure"]
        direction TB
        F_SRC["frontend/src/"]
        F_ENTRY["main.jsx / App.jsx (Root & Theme Setup)"]
        F_ROUTES["routes/ AppRoutes.jsx (Route Definitions)"]
        F_LAYOUTS["layouts/ (MainLayout, AuthLayout)"]
        F_PAGES["pages/ (Dashboard, Vouchers, Masters, Reports, Settings, Login)"]
        F_VOUCHERS["components/vouchers/ (Journal, CashPayment, BankPayment, Contra, Notes)"]
        F_MASTERS["components/masters/ (AccountMaster, GroupMaster, SubGroupMaster, TDSMaster)"]
        F_REPORTS["components/reports/ (DayBook, CashBook, GeneralLedger, TrialBalance, ProfitLoss, BalanceSheet)"]
        F_COMMON["components/common/ (Sidebar, Navbar, DataTable, DateFilter, SearchPanel, ExcelImport)"]
        F_DB["database.js (Optimistic Client Cache & Accounting Calculation Engine)"]
        F_API["api/ (axios.js, voucherApi, masterApi, reportApi, authApi)"]

        F_SRC --> F_ENTRY
        F_SRC --> F_ROUTES
        F_SRC --> F_LAYOUTS
        F_SRC --> F_PAGES
        F_SRC --> F_VOUCHERS
        F_SRC --> F_MASTERS
        F_SRC --> F_REPORTS
        F_SRC --> F_COMMON
        F_SRC --> F_DB
        F_SRC --> F_API
    end

    subgraph FA["Frontend Module Architecture"]
        direction TB
        USER_ACT["User Action (Voucher Entry, Report Filter, Master Setup)"]
        VIEW_UI["React View Layer (Tailwind CSS, Data Grids, Forms, Modals)"]
        ROUTING["React Router DOM (Protected & Public Navigation)"]
        STATE_STORE["State Management (AuthContext & subscribeToDB Reactive Bus)"]
        CALC_ENGINE["Financial Logic Engine (Trial Balance, P&L, Ledger, DayBook Calculations)"]
        API_LAYER["API Service Layer (Axios HTTP Client with Interceptors)"]
        BACKEND_TARGET["Backend REST Endpoints (/ams/*)"]

        USER_ACT --> VIEW_UI
        VIEW_UI --> ROUTING
        VIEW_UI --> STATE_STORE
        STATE_STORE --> CALC_ENGINE
        STATE_STORE --> API_LAYER
        API_LAYER --> BACKEND_TARGET
        BACKEND_TARGET -. Sync Data .-> STATE_STORE
    end

    F_ROUTES -.-> ROUTING
    F_VOUCHERS -.-> VIEW_UI
    F_REPORTS -.-> VIEW_UI
    F_DB -.-> STATE_STORE
    F_DB -.-> CALC_ENGINE
    F_API -.-> API_LAYER
```

---

## 3. Double-Entry Voucher Processing Workflow (Black & White)

```mermaid
%%{init: {'theme': 'neutral', 'themeVariables': { 'primaryColor': '#ffffff', 'primaryBorderColor': '#000000', 'primaryTextColor': '#000000', 'lineColor': '#000000', 'secondaryColor': '#f5f5f5', 'tertiaryColor': '#ffffff', 'clusterBkg': '#ffffff', 'clusterBorder': '#000000' }}}%%
flowchart TD
    START(["Start: User Opens Voucher Entry Form"]) --> SEL_TYPE["Select Voucher Type (JV, Cash Payment, Bank Payment, Contra, Debit/Credit Note)"]
    SEL_TYPE --> GEN_NUM["Auto-Generate Next Serial Voucher Number (e.g. JV-00001, CP-00001)"]
    GEN_NUM --> INPUT_HDR["Input Voucher Header (Voucher Date, Reference No, Overall Narration)"]
    INPUT_HDR --> INPUT_LINES["Input Accounting Rows (Account Head, Debit Amount, Credit Amount, Row Narration)"]
    INPUT_LINES --> TAX_CALC{"TDS / Tax Applicable?"}
    TAX_CALC -- "Yes" --> APPLY_TAX["Lookup TDS Master, Compute Surcharge & Cess, Auto-Append TDS Ledger Row"]
    TAX_CALC -- "No" --> SUM_CHECK["Calculate Running Totals: Total Debit and Total Credit"]
    APPLY_TAX --> SUM_CHECK

    SUM_CHECK --> BAL_DECISION{"Is Balanced? (Total Debit == Total Credit and Total > 0)"}
    
    BAL_DECISION -- "No (Out of Balance)" --> SHOW_ERR["Display Balance Discrepancy Alert & Block Submission"]
    SHOW_ERR --> INPUT_LINES

    BAL_DECISION -- "Yes (Balanced)" --> DISPATCH_API["Submit Payload: POST /ams/vouchers (or /contra-entries)"]
    
    DISPATCH_API --> BACKEND_TX["Backend Starts DB Transaction"]
    BACKEND_TX --> SAVE_HDR["Upsert Voucher Header in DB (Voucher Table)"]
    SAVE_HDR --> SAVE_LINES["Delete Old Rows & Bulk Insert Items (VoucherItem Table)"]
    SAVE_LINES --> AUDIT_LOG["Record Audit Trail Entry in AuditLog Table"]
    AUDIT_LOG --> COMMIT_TX["Commit Transaction & Return Success Response"]

    COMMIT_TX --> REFRESH_STATE["Update Frontend Cache (subscribeToDB Event Broadcast)"]
    
    REFRESH_STATE --> UPDATE_GL["Update General Ledger: Post Debits and Credits to Account Ledgers"]
    REFRESH_STATE --> UPDATE_TB["Recalculate Trial Balance: Verify System-Wide Accounting Balance"]
    REFRESH_STATE --> UPDATE_STATEMENTS["Recalculate Profit & Loss Statement and Balance Sheet"]
    REFRESH_STATE --> TALLY_OPT{"Export to Tally Configured?"}

    TALLY_OPT -- "Yes" --> TALLY_XML["Generate Tally XML Voucher & Transmit via HTTP to Port 9000"]
    TALLY_OPT -- "No" --> FINISH(["Finish: Voucher Posted & Reflected Across All Financial Books"])
    TALLY_XML --> FINISH
```

---

## 4. Class Diagram of Mill Account Management System (Black & White)

```mermaid
%%{init: {'theme': 'neutral', 'themeVariables': { 'primaryColor': '#ffffff', 'primaryBorderColor': '#000000', 'primaryTextColor': '#000000', 'lineColor': '#000000', 'secondaryColor': '#f5f5f5', 'tertiaryColor': '#ffffff' }}}%%
classDiagram
    class User {
        +Integer id
        +String userName
        +String password
        +Boolean isCurrent
        +authenticate(credentials)
        +register(userData)
        +switchUser(userName)
    }

    class Group {
        +String id
        +String name
        +String mainDescription
        +Object payload
        +createGroup()
        +listGroups()
        +deleteGroup()
    }

    class SubGroup {
        +String id
        +String name
        +String groupName
        +String mainDescription
        +String ledgerType
        +Integer tbSlNo
        +Integer pAndL
        +Object payload
        +createSubGroup()
        +listSubGroups()
        +deleteSubGroup()
    }

    class Account {
        +String code
        +String name
        +String groupName
        +String subGroupName
        +Decimal openingDebit
        +Decimal openingCredit
        +Object payload
        +saveAccount()
        +bulkSave(accountList)
        +deleteAccount(code)
        +getRunningBalance(asOfDate)
    }

    class Voucher {
        +String id
        +String voucherNo
        +Date voucherDate
        +String type
        +String narration
        +Decimal totalAmount
        +String userName
        +Object payload
        +saveVoucher()
        +deleteVoucher(id)
        +validateDoubleEntry()
        +getNextVoucherNumber(type)
    }

    class VoucherItem {
        +Integer id
        +String voucherId
        +String accountCode
        +Decimal debit
        +Decimal credit
        +String narration
        +Object payload
        +validateItem()
    }

    class ContraEntry {
        +String id
        +String voucherNo
        +Date voucherDate
        +String type
        +Decimal totalAmount
        +Object payload
        +saveContra()
        +deleteContra(id)
    }

    class ContraEntryItem {
        +Integer id
        +String contraEntryId
        +String accountCode
        +Decimal debit
        +Decimal credit
        +String narration
        +Object payload
    }

    class TDSMaster {
        +String code
        +String name
        +Decimal tdsPercentage
        +Decimal scPercentage
        +Decimal chessPercentage
        +Decimal hsChessPercentage
        +String accountHeadName
        +String sectionCode
        +Object payload
        +computeTds(baseAmount)
    }

    class AuditLog {
        +String id
        +DateTime timestamp
        +String userName
        +String action
        +String details
        +recordLog(action, details)
    }

    class AccountingEngine {
        +computeGeneralLedgerRange(accountCode, fromDate, toDate)
        +computeTrialBalance(asOfDate)
        +computeProfitLoss(fromDate, toDate)
        +computeBalanceSheet(asOfDate)
        +computeDayBook(fromDate, toDate)
        +computeCashBook(accountCode, fromDate, toDate)
    }

    class TallyIntegrationService {
        +buildEnvelopeXML(voucher)
        +sendToTally(xmlData, port)
        +exportVouchersBatch(dateRange)
    }

    Group "1" --> "0..*" SubGroup : classifies
    SubGroup "1" --> "0..*" Account : categorizes
    Voucher "1" *-- "1..*" VoucherItem : contains
    Account "1" <-- "0..*" VoucherItem : posts_to
    ContraEntry "1" *-- "1..*" ContraEntryItem : contains
    Account "1" <-- "0..*" ContraEntryItem : posts_to
    User "1" --> "0..*" Voucher : enters
    User "1" --> "0..*" AuditLog : triggers
    AccountingEngine ..> Voucher : reads_transactions
    AccountingEngine ..> Account : aggregates_balances
    TallyIntegrationService ..> Voucher : serializes_to_xml
```

---

## 5. Entity-Relationship (ER) Diagram of KR Accounts ERP (Black & White)

```mermaid
%%{init: {'theme': 'neutral', 'themeVariables': { 'primaryColor': '#ffffff', 'primaryBorderColor': '#000000', 'primaryTextColor': '#000000', 'lineColor': '#000000', 'secondaryColor': '#f5f5f5', 'tertiaryColor': '#ffffff' }}}%%
erDiagram
    USERS {
        int id PK
        string userName UK
        string password
        boolean isCurrent
    }

    GROUPS {
        string id PK
        string name
        string mainDescription
        json payload
    }

    SUB_GROUPS {
        string id PK
        string name
        string groupName
        string mainDescription
        string ledgerType
        int tbSlNo
        int pAndL
        json payload
    }

    ACCOUNTS {
        string code PK
        string name
        string groupName
        string subGroupName
        decimal openingDebit
        decimal openingCredit
        json payload
    }

    VOUCHERS {
        string id PK
        string voucherNo
        date voucherDate
        string type
        text narration
        decimal totalAmount
        string userName
        json payload
    }

    VOUCHER_ITEMS {
        int id PK
        string voucherId FK
        string accountCode FK
        decimal debit
        decimal credit
        text narration
        json payload
    }

    CONTRA_ENTRIES {
        string id PK
        string voucherNo
        date voucherDate
        string type
        decimal totalAmount
        json payload
    }

    CONTRA_ENTRY_ITEMS {
        int id PK
        string contraEntryId FK
        string accountCode FK
        decimal debit
        decimal credit
        string narration
        json payload
    }

    TDS_MASTERS {
        string code PK
        string name
        decimal tdsPercentage
        decimal scPercentage
        decimal chessPercentage
        decimal hsChessPercentage
        string accountHeadName
        string sectionCode
        json payload
    }

    AUDIT_LOGS {
        string id PK
        datetime timestamp
        string userName
        string action
        text details
    }

    APP_RECORDS {
        string collection PK
        string recordKey PK
        json payload
    }

    GROUPS ||--o{ SUB_GROUPS : "categorizes"
    SUB_GROUPS ||--o{ ACCOUNTS : "classifies"
    USERS ||--o{ VOUCHERS : "creates"
    USERS ||--o{ AUDIT_LOGS : "logs"
    VOUCHERS ||--|{ VOUCHER_ITEMS : "contains"
    ACCOUNTS ||--o{ VOUCHER_ITEMS : "referenced_in"
    CONTRA_ENTRIES ||--|{ CONTRA_ENTRY_ITEMS : "contains"
    ACCOUNTS ||--o{ CONTRA_ENTRY_ITEMS : "referenced_in"
```
