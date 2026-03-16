-- ============================================================
-- JCI Mining – AP Invoice Review – Sample Test Data
-- ============================================================

-- Documents
INSERT INTO Document (FileName, FilePath, SourceMailbox, ReceivedDateTime, ProcessedDateTime, RawExtractionJson)
VALUES
  ('INV_BSA_2026_0042.pdf', '/invoices/2026/03/', 'accounts@jcimining.co.za', '2026-03-10 08:15:00', '2026-03-10 08:16:22', '{"confidence":0.97}'),
  ('INV_MES_MAR2026.pdf',   '/invoices/2026/03/', 'accounts@jcimining.co.za', '2026-03-11 09:30:00', '2026-03-11 09:31:05', '{"confidence":0.91}'),
  ('DB_INVOICE_Q1.pdf',     '/invoices/2026/03/', 'accounts@jcimining.co.za', '2026-03-12 14:00:00', '2026-03-12 14:01:30', '{"confidence":0.88}'),
  ('UNKNOWN_VENDOR.pdf',    '/invoices/2026/03/', 'accounts@jcimining.co.za', '2026-03-13 10:45:00', '2026-03-13 10:46:10', '{"confidence":0.72}'),
  ('DUPLICATE_TEST.pdf',    '/invoices/2026/03/', 'accounts@jcimining.co.za', '2026-03-14 11:00:00', '2026-03-14 11:01:00', '{"confidence":0.95}');

-- Invoice Headers
INSERT INTO InvoiceHeader (DocumentId, SupplierName, SupplierVatNumber, InvoiceNumber, InvoiceDate, PurchaseOrderNumber, Currency, SubtotalAmount, VatAmount, TotalAmount, BankName, BankAccountNumber, BankBranchCode, ExtractionConfidence)
VALUES
  (1, 'Boilermakers SA (Pty) Ltd', '4820193847', 'BSA-2026-1847', '2026-03-08', 'PO-2026-0042', 'ZAR', 160869.57, 24130.43, 185000.00, 'First National Bank', '62345678901', '250655', 97.00),
  (2, 'Mining Equipment Suppliers', '5930284756', 'MES-INV-00341', '2026-03-10', 'PO-2026-0051', 'ZAR', 85869.57, 12630.43, 98500.00, 'Standard Bank', '01234567890', '051001', 91.00),
  (3, 'Drill & Blast Solutions',    '6710394857', 'DBS-Q1-2026',   '2026-03-11', 'PO-2026-0063', 'ZAR', 37282.61, 5592.39,  42875.00, 'Nedbank',            '11223344556', '198765', 88.00),
  (4, 'Acme General Supplies Ltd',  '9990001234', 'ACME-5521',     '2026-03-12', NULL,            'ZAR', 15217.39, 2282.61,  17500.00, 'Capitec',            '33445566778', '470010', 72.00),
  (5, 'Boilermakers SA (Pty) Ltd',  '4820193847', 'BSA-2026-1847', '2026-03-08', 'PO-2026-0042', 'ZAR', 160869.57, 24130.43, 185000.00, 'First National Bank', '62345678901', '250655', 95.00);

-- Invoice Lines
INSERT INTO InvoiceLine (InvoiceHeaderId, LineNumber, Description, Quantity, UnitPrice, LineAmount)
VALUES
  (1, 1, 'Steel fabrication works - Phase 1', 1.0000, 95000.00, 95000.00),
  (1, 2, 'Labour and installation',           1.0000, 90000.00, 90000.00),
  (2, 1, 'Hydraulic drill rig rental - March 2026', 1.0000, 98500.00, 98500.00),
  (3, 1, 'Explosive charges - ANFO 500kg',    50.0000, 640.00, 32000.00),
  (3, 2, 'Detonators - electric type B',      200.0000, 53.75, 10750.00),
  (4, 1, 'General office supplies Q1 2026',   1.0000, 17500.00, 17500.00),
  (5, 1, 'Steel fabrication works - Phase 1', 1.0000, 95000.00, 95000.00),
  (5, 2, 'Labour and installation',           1.0000, 90000.00, 90000.00);

-- ApprovalQueue — initial status = New for all invoices
INSERT INTO ApprovalQueue (InvoiceHeaderId, CurrentStatus, ReadyForExport, ExportStatus)
VALUES
  (1, 'New', 0, 'Pending'),
  (2, 'New', 0, 'Pending'),
  (3, 'New', 0, 'Pending'),
  (4, 'New', 0, 'Pending'),
  (5, 'New', 0, 'Pending');

-- Initial audit log entries
INSERT INTO ApprovalActionLog (ApprovalQueueId, ActionType, ActionBy, Comments)
VALUES
  (1, 'Submitted', 'Logic App', 'Invoice received and extracted from email'),
  (2, 'Submitted', 'Logic App', 'Invoice received and extracted from email'),
  (3, 'Submitted', 'Logic App', 'Invoice received and extracted from email'),
  (4, 'Submitted', 'Logic App', 'Invoice received and extracted from email'),
  (5, 'Submitted', 'Logic App', 'Invoice received and extracted from email');
