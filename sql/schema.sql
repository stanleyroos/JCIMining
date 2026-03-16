-- ============================================================
-- JCI Mining – Accounts Payable Invoice Review
-- Database Schema v1.0
-- ============================================================

-- ============================================================
-- EXTRACTION LAYER
-- ============================================================

CREATE TABLE Document (
    DocumentId        INT IDENTITY(1,1) PRIMARY KEY,
    FileName          NVARCHAR(500)     NOT NULL,
    FilePath          NVARCHAR(1000)    NULL,
    SourceMailbox     NVARCHAR(255)     NULL,
    ReceivedDateTime  DATETIME2         NULL,
    ProcessedDateTime DATETIME2         NULL,
    RawExtractionJson NVARCHAR(MAX)     NULL,
    CreatedDateTime   DATETIME2         NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE InvoiceHeader (
    InvoiceHeaderId       INT IDENTITY(1,1) PRIMARY KEY,
    DocumentId            INT               NOT NULL REFERENCES Document(DocumentId),
    SupplierName          NVARCHAR(500)     NULL,
    SupplierVatNumber     NVARCHAR(50)      NULL,
    InvoiceNumber         NVARCHAR(100)     NULL,
    InvoiceDate           DATE              NULL,
    PurchaseOrderNumber   NVARCHAR(100)     NULL,
    Currency              NVARCHAR(10)      NULL DEFAULT 'ZAR',
    SubtotalAmount        DECIMAL(18,2)     NULL,
    VatAmount             DECIMAL(18,2)     NULL,
    TotalAmount           DECIMAL(18,2)     NULL,
    BankName              NVARCHAR(200)     NULL,
    BankAccountNumber     NVARCHAR(50)      NULL,
    BankBranchCode        NVARCHAR(20)      NULL,
    ExtractionConfidence  DECIMAL(5,2)      NULL,
    CreatedDateTime       DATETIME2         NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE InvoiceLine (
    InvoiceLineId     INT IDENTITY(1,1) PRIMARY KEY,
    InvoiceHeaderId   INT               NOT NULL REFERENCES InvoiceHeader(InvoiceHeaderId),
    LineNumber        INT               NOT NULL,
    Description       NVARCHAR(500)     NULL,
    Quantity          DECIMAL(18,4)     NULL,
    UnitPrice         DECIMAL(18,2)     NULL,
    LineAmount        DECIMAL(18,2)     NULL
);

-- ============================================================
-- SAGE REFERENCE STAGING TABLES
-- ============================================================

CREATE TABLE SupplierMaster (
    SupplierId          INT IDENTITY(1,1) PRIMARY KEY,
    SupplierCode        NVARCHAR(50)      NOT NULL,
    SupplierName        NVARCHAR(500)     NOT NULL,
    SupplierVatNumber   NVARCHAR(50)      NULL,
    BankName            NVARCHAR(200)     NULL,
    BankAccountNumber   NVARCHAR(50)      NULL,
    BankBranchCode      NVARCHAR(20)      NULL,
    IsActive            BIT               NOT NULL DEFAULT 1,
    UpdatedDateTime     DATETIME2         NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE PurchaseOrderMaster (
    PurchaseOrderId     INT IDENTITY(1,1) PRIMARY KEY,
    PurchaseOrderNumber NVARCHAR(100)     NOT NULL,
    SupplierCode        NVARCHAR(50)      NOT NULL,
    PoDate              DATE              NULL,
    Currency            NVARCHAR(10)      NULL DEFAULT 'ZAR',
    TotalAmount         DECIMAL(18,2)     NULL,
    RemainingAmount     DECIMAL(18,2)     NULL,
    Status              NVARCHAR(50)      NULL DEFAULT 'Open'
);

CREATE TABLE PurchaseOrderLine (
    PurchaseOrderLineId INT IDENTITY(1,1) PRIMARY KEY,
    PurchaseOrderId     INT               NOT NULL REFERENCES PurchaseOrderMaster(PurchaseOrderId),
    LineNumber          INT               NOT NULL,
    Description         NVARCHAR(500)     NULL,
    Quantity            DECIMAL(18,4)     NULL,
    UnitPrice           DECIMAL(18,2)     NULL,
    LineAmount          DECIMAL(18,2)     NULL
);

-- ============================================================
-- REVIEW & MATCHING LAYER
-- ============================================================

CREATE TABLE InvoiceMatchResult (
    InvoiceMatchResultId INT IDENTITY(1,1) PRIMARY KEY,
    InvoiceHeaderId      INT               NOT NULL REFERENCES InvoiceHeader(InvoiceHeaderId),
    SupplierMatchFlag    BIT               NULL,
    PoMatchFlag          BIT               NULL,
    AmountMatchFlag      BIT               NULL,
    BankMatchFlag        BIT               NULL,
    DuplicateInvoiceFlag BIT               NULL,
    MatchStatus          NVARCHAR(50)      NULL,  -- Matched | NeedsReview | FraudRisk
    MatchScore           INT               NULL,
    MatchReason          NVARCHAR(MAX)     NULL,
    MatchedSupplierId    INT               NULL REFERENCES SupplierMaster(SupplierId),
    MatchedPoId          INT               NULL REFERENCES PurchaseOrderMaster(PurchaseOrderId),
    CreatedDateTime      DATETIME2         NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE ApprovalQueue (
    ApprovalQueueId   INT IDENTITY(1,1) PRIMARY KEY,
    InvoiceHeaderId   INT               NOT NULL REFERENCES InvoiceHeader(InvoiceHeaderId),
    CurrentStatus     NVARCHAR(50)      NOT NULL DEFAULT 'New',
        -- New | Matched | NeedsReview | FraudRisk | Approved | Rejected | Referred | Exported
    AssignedTo        NVARCHAR(255)     NULL,
    ReviewedBy        NVARCHAR(255)     NULL,
    ReviewedDateTime  DATETIME2         NULL,
    ReviewComments    NVARCHAR(MAX)     NULL,
    ReadyForExport    BIT               NOT NULL DEFAULT 0,
    ExportStatus      NVARCHAR(50)      NULL DEFAULT 'Pending',
        -- Pending | Exported
    CreatedDateTime   DATETIME2         NOT NULL DEFAULT GETUTCDATE(),
    UpdatedDateTime   DATETIME2         NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE ApprovalActionLog (
    ApprovalActionLogId INT IDENTITY(1,1) PRIMARY KEY,
    ApprovalQueueId     INT               NOT NULL REFERENCES ApprovalQueue(ApprovalQueueId),
    ActionType          NVARCHAR(50)      NOT NULL,
        -- Submitted | Matched | Approved | Rejected | Referred | MarkedForExport | Exported
    ActionBy            NVARCHAR(255)     NOT NULL,
    ActionDateTime      DATETIME2         NOT NULL DEFAULT GETUTCDATE(),
    Comments            NVARCHAR(MAX)     NULL
);

-- ============================================================
-- SAGE EXPORT LAYER
-- ============================================================

CREATE TABLE SageExportBatch (
    SageExportBatchId INT IDENTITY(1,1) PRIMARY KEY,
    BatchReference    NVARCHAR(100)     NOT NULL,
    BatchDate         DATE              NOT NULL DEFAULT CAST(GETUTCDATE() AS DATE),
    ExportStatus      NVARCHAR(50)      NOT NULL DEFAULT 'Pending',
        -- Pending | Complete | Failed
    FileName          NVARCHAR(500)     NULL,
    RecordCount       INT               NULL DEFAULT 0,
    CreatedDateTime   DATETIME2         NOT NULL DEFAULT GETUTCDATE(),
    ExportedDateTime  DATETIME2         NULL
);

CREATE TABLE SageExportBatchItem (
    SageExportBatchItemId INT IDENTITY(1,1) PRIMARY KEY,
    SageExportBatchId     INT               NOT NULL REFERENCES SageExportBatch(SageExportBatchId),
    InvoiceHeaderId       INT               NOT NULL REFERENCES InvoiceHeader(InvoiceHeaderId),
    ExportLineStatus      NVARCHAR(50)      NULL DEFAULT 'Included',
        -- Included | Skipped | Error
    ExportedDateTime      DATETIME2         NULL,
    ErrorMessage          NVARCHAR(MAX)     NULL
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IX_InvoiceHeader_DocumentId      ON InvoiceHeader(DocumentId);
CREATE INDEX IX_InvoiceHeader_SupplierName    ON InvoiceHeader(SupplierName);
CREATE INDEX IX_InvoiceHeader_InvoiceNumber   ON InvoiceHeader(InvoiceNumber);
CREATE INDEX IX_InvoiceLine_InvoiceHeaderId   ON InvoiceLine(InvoiceHeaderId);
CREATE INDEX IX_InvoiceMatchResult_HeaderId   ON InvoiceMatchResult(InvoiceHeaderId);
CREATE INDEX IX_ApprovalQueue_HeaderId        ON ApprovalQueue(InvoiceHeaderId);
CREATE INDEX IX_ApprovalQueue_Status          ON ApprovalQueue(CurrentStatus);
CREATE INDEX IX_ApprovalQueue_ReadyForExport  ON ApprovalQueue(ReadyForExport);
CREATE INDEX IX_ApprovalActionLog_QueueId     ON ApprovalActionLog(ApprovalQueueId);
CREATE INDEX IX_SageExportBatchItem_BatchId   ON SageExportBatchItem(SageExportBatchId);
CREATE INDEX IX_SupplierMaster_Code           ON SupplierMaster(SupplierCode);
CREATE INDEX IX_SupplierMaster_VatNumber      ON SupplierMaster(SupplierVatNumber);
CREATE INDEX IX_PurchaseOrder_Number          ON PurchaseOrderMaster(PurchaseOrderNumber);
