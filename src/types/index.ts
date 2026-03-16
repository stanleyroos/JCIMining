// ============================================================
// JCI Mining – AP Invoice Review – Type Definitions
// ============================================================

export type InvoiceStatus =
  | 'New'
  | 'Matched'
  | 'NeedsReview'
  | 'FraudRisk'
  | 'Approved'
  | 'Rejected'
  | 'Referred'
  | 'Exported';

export type ActionType =
  | 'Submitted'
  | 'Matched'
  | 'Approved'
  | 'Rejected'
  | 'Referred'
  | 'MarkedForExport'
  | 'Exported';

export type ExportBatchStatus = 'Pending' | 'Complete' | 'Failed';
export type ExportItemStatus = 'Included' | 'Skipped' | 'Error';

// ---- Extraction Layer ----

export interface Document {
  DocumentId: number;
  FileName: string;
  FilePath: string | null;
  SourceMailbox: string | null;
  ReceivedDateTime: string | null;
  ProcessedDateTime: string | null;
  CreatedDateTime: string;
}

export interface InvoiceHeader {
  InvoiceHeaderId: number;
  DocumentId: number;
  SupplierName: string | null;
  SupplierVatNumber: string | null;
  InvoiceNumber: string | null;
  InvoiceDate: string | null;
  PurchaseOrderNumber: string | null;
  Currency: string | null;
  SubtotalAmount: number | null;
  VatAmount: number | null;
  TotalAmount: number | null;
  BankName: string | null;
  BankAccountNumber: string | null;
  BankBranchCode: string | null;
  ExtractionConfidence: number | null;
  CreatedDateTime: string;
}

export interface InvoiceLine {
  InvoiceLineId: number;
  InvoiceHeaderId: number;
  LineNumber: number;
  Description: string | null;
  Quantity: number | null;
  UnitPrice: number | null;
  LineAmount: number | null;
}

// ---- Sage Staging ----

export interface SupplierMaster {
  SupplierId: number;
  SupplierCode: string;
  SupplierName: string;
  SupplierVatNumber: string | null;
  BankName: string | null;
  BankAccountNumber: string | null;
  BankBranchCode: string | null;
  IsActive: boolean;
}

export interface PurchaseOrderMaster {
  PurchaseOrderId: number;
  PurchaseOrderNumber: string;
  SupplierCode: string;
  PoDate: string | null;
  Currency: string | null;
  TotalAmount: number | null;
  RemainingAmount: number | null;
  Status: string | null;
}

// ---- Review & Matching ----

export interface InvoiceMatchResult {
  InvoiceMatchResultId: number;
  InvoiceHeaderId: number;
  SupplierMatchFlag: boolean | null;
  PoMatchFlag: boolean | null;
  AmountMatchFlag: boolean | null;
  BankMatchFlag: boolean | null;
  DuplicateInvoiceFlag: boolean | null;
  MatchStatus: string | null;
  MatchScore: number | null;
  MatchReason: string | null;
  MatchedSupplierId: number | null;
  MatchedPoId: number | null;
  CreatedDateTime: string;
}

export interface ApprovalQueue {
  ApprovalQueueId: number;
  InvoiceHeaderId: number;
  CurrentStatus: InvoiceStatus;
  AssignedTo: string | null;
  ReviewedBy: string | null;
  ReviewedDateTime: string | null;
  ReviewComments: string | null;
  ReadyForExport: boolean;
  ExportStatus: string | null;
  CreatedDateTime: string;
  UpdatedDateTime: string;
}

export interface ApprovalActionLog {
  ApprovalActionLogId: number;
  ApprovalQueueId: number;
  ActionType: ActionType;
  ActionBy: string;
  ActionDateTime: string;
  Comments: string | null;
}

// ---- Export Layer ----

export interface SageExportBatch {
  SageExportBatchId: number;
  BatchReference: string;
  BatchDate: string;
  ExportStatus: ExportBatchStatus;
  FileName: string | null;
  RecordCount: number | null;
  CreatedDateTime: string;
  ExportedDateTime: string | null;
}

export interface SageExportBatchItem {
  SageExportBatchItemId: number;
  SageExportBatchId: number;
  InvoiceHeaderId: number;
  ExportLineStatus: ExportItemStatus;
  ExportedDateTime: string | null;
  ErrorMessage: string | null;
}

// ---- Composite / API response types ----

export interface InvoiceListItem {
  InvoiceHeaderId: number;
  DocumentId: number;
  FileName: string;
  SupplierName: string | null;
  InvoiceNumber: string | null;
  InvoiceDate: string | null;
  TotalAmount: number | null;
  Currency: string | null;
  CurrentStatus: InvoiceStatus;
  MatchScore: number | null;
  ReadyForExport: boolean;
  CreatedDateTime: string;
}

export interface InvoiceDetail extends InvoiceHeader {
  Document: Document;
  Lines: InvoiceLine[];
  MatchResult: InvoiceMatchResult | null;
  Queue: ApprovalQueue | null;
  AuditLog: ApprovalActionLog[];
}

export interface DashboardStats {
  total: number;
  New: number;
  Matched: number;
  NeedsReview: number;
  FraudRisk: number;
  Approved: number;
  Rejected: number;
  Referred: number;
  Exported: number;
  readyForExport: number;
}
