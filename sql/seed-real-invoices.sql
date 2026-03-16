-- ============================================================
-- JCI Mining – Real Invoice Sample Data
-- 6 Suppliers | 9 Purchase Orders | 9 Invoices from 7 PDFs
-- Simulates Logic App extraction from accounts mailbox
-- ============================================================

-- ============================================================
-- STEP 1: Clean all existing data (reverse FK order)
-- ============================================================
DELETE FROM ApprovalActionLog;
DELETE FROM SageExportBatchItem;
DELETE FROM SageExportBatch;
DELETE FROM ApprovalQueue;
DELETE FROM InvoiceMatchResult;
DELETE FROM InvoiceLine;
DELETE FROM InvoiceHeader;
DELETE FROM Document;
DELETE FROM PurchaseOrderLine;
DELETE FROM PurchaseOrderMaster;
DELETE FROM SupplierMaster;

-- ============================================================
-- STEP 2: Supplier Master (as imported from Sage X3)
-- ============================================================
INSERT INTO SupplierMaster (SupplierCode, SupplierName, SupplierVatNumber, BankName, BankAccountNumber, BankBranchCode) VALUES
('BWE001', 'Barloworld Equipment',                              '4710250293', 'FNB',               '62154981204',  '250655'),
('ITR001', 'ITR South Africa Earthmoving (Pty) Ltd',           '4320276563', 'Investec Bank',      '40005033909',  '580105'),
('HIT001', 'Hitachi Construction Machinery SA Co. (Pty) Ltd',  '4050105008', 'FNB',               '55121243758',  '250655'),
('ALF001', 'Alfagomma HYD & IND Services SA (Pty)',            '4450263241', 'ABSA Bank Limited',  '4081049906',   '632005'),
('BAB001', 'Babcock Africa Services (Pty) Ltd',                '4440150169', 'RMB Corporate Bank', '58860017575',  '255005'),
('EFD001', 'Easy Flow Diesel (Pty) Ltd',                       '4290185273', 'ABSA',               '4048709319',   '632005');

-- ============================================================
-- STEP 3: Purchase Order Master (as imported from Sage X3)
-- ============================================================
INSERT INTO PurchaseOrderMaster (PurchaseOrderNumber, SupplierCode, PoDate, Currency, TotalAmount, RemainingAmount, Status) VALUES
('LAC2412POH00000005', 'BWE001', '2024-12-01', 'ZAR',   2273.68,   2273.68, 'Open'),
('LAB2411POH00000095', 'ITR001', '2024-11-20', 'ZAR', 219853.27, 219853.27, 'Open'),
('RIS2406POH00000108', 'HIT001', '2024-06-15', 'ZAR',   8427.05,   8427.05, 'Open'),
('LAC2406POH00000075', 'HIT001', '2024-06-15', 'ZAR',   3566.64,   3566.64, 'Open'),
('LAC2406POH00000097', 'HIT001', '2024-06-15', 'ZAR',   1164.12,   1164.12, 'Open'),
('JCI86697',           'ALF001', '2024-03-13', 'ZAR',   8803.45,   8803.45, 'Open'),
('SERV-BABCOCK-2024',  'BAB001', '2024-12-01', 'ZAR',  63230.51,  63230.51, 'Open'),
('A738740',            'EFD001', '2025-02-20', 'ZAR',   2311.20,   2311.20, 'Open'),
('C339745',            'EFD001', '2025-02-27', 'ZAR',    949.10,    949.10, 'Open');

-- ============================================================
-- STEP 4: Purchase Order Lines (summary lines per PO)
-- ============================================================
DECLARE @poId INT;

SELECT @poId = PurchaseOrderId FROM PurchaseOrderMaster WHERE PurchaseOrderNumber = 'LAC2412POH00000005';
INSERT INTO PurchaseOrderLine (PurchaseOrderId, LineNumber, Description, Quantity, UnitPrice, LineAmount)
VALUES (@poId, 1, 'D9R Machine Parts - Various (Sales Order 10125143)', 1, 2273.68, 2273.68);

SELECT @poId = PurchaseOrderId FROM PurchaseOrderMaster WHERE PurchaseOrderNumber = 'LAB2411POH00000095';
INSERT INTO PurchaseOrderLine (PurchaseOrderId, LineNumber, Description, Quantity, UnitPrice, LineAmount)
VALUES (@poId, 1, 'Track & Undercarriage Rebuild - POD 10253 (Delivery Customer Site)', 1, 219853.27, 219853.27);

SELECT @poId = PurchaseOrderId FROM PurchaseOrderMaster WHERE PurchaseOrderNumber = 'RIS2406POH00000108';
INSERT INTO PurchaseOrderLine (PurchaseOrderId, LineNumber, Description, Quantity, UnitPrice, LineAmount)
VALUES (@poId, 1, 'Hitachi Spare Parts - Bearings, Seals, Shims, Gasket, Plate (Ref SASH-000991803)', 1, 8427.05, 8427.05);

SELECT @poId = PurchaseOrderId FROM PurchaseOrderMaster WHERE PurchaseOrderNumber = 'LAC2406POH00000075';
INSERT INTO PurchaseOrderLine (PurchaseOrderId, LineNumber, Description, Quantity, UnitPrice, LineAmount)
VALUES (@poId, 1, 'Hitachi Water Hose 4009.42-0004 (Ref SASH-000991868)', 1, 3566.64, 3566.64);

SELECT @poId = PurchaseOrderId FROM PurchaseOrderMaster WHERE PurchaseOrderNumber = 'LAC2406POH00000097';
INSERT INTO PurchaseOrderLine (PurchaseOrderId, LineNumber, Description, Quantity, UnitPrice, LineAmount)
VALUES (@poId, 1, 'Hitachi V-Belt 4010.31-0006 (Ref SASH-000991793)', 1, 1164.12, 1164.12);

SELECT @poId = PurchaseOrderId FROM PurchaseOrderMaster WHERE PurchaseOrderNumber = 'JCI86697';
INSERT INTO PurchaseOrderLine (PurchaseOrderId, LineNumber, Description, Quantity, UnitPrice, LineAmount)
VALUES (@poId, 1, 'Hydraulic Hoses & Fittings - CJCI459 Job Card 216539', 1, 8803.45, 8803.45);

SELECT @poId = PurchaseOrderId FROM PurchaseOrderMaster WHERE PurchaseOrderNumber = 'SERV-BABCOCK-2024';
INSERT INTO PurchaseOrderLine (PurchaseOrderId, LineNumber, Description, Quantity, UnitPrice, LineAmount)
VALUES (@poId, 1, 'Volvo ADT Fleet Service Agreement - December 2024 (Account 111687)', 1, 63230.51, 63230.51);

SELECT @poId = PurchaseOrderId FROM PurchaseOrderMaster WHERE PurchaseOrderNumber = 'A738740';
INSERT INTO PurchaseOrderLine (PurchaseOrderId, LineNumber, Description, Quantity, UnitPrice, LineAmount)
VALUES (@poId, 1, 'Diesel Supply - REG KLG088MP (JCI66529)', 107, 21.60, 2311.20);

SELECT @poId = PurchaseOrderId FROM PurchaseOrderMaster WHERE PurchaseOrderNumber = 'C339745';
INSERT INTO PurchaseOrderLine (PurchaseOrderId, LineNumber, Description, Quantity, UnitPrice, LineAmount)
VALUES (@poId, 1, 'Diesel Supply - REG KMT723MP (JCI66529)', 43.94, 21.60, 949.10);

-- ============================================================
-- STEP 5: Documents + Invoices (Logic App simulation)
-- ============================================================
DECLARE @docId INT, @invId INT, @queueId INT;

-- ============================================================
-- INVOICE 1: Barloworld Equipment – Tax Invoice 917627981
-- 6 line items, D9R machine parts
-- Date: 02/12/2024 | Total: R2,273.68
-- Bank: NOT on invoice (Barloworld do not print bank details)
-- ============================================================
INSERT INTO Document (FileName, FilePath, SourceMailbox, ReceivedDateTime, ProcessedDateTime)
VALUES ('0917627981.pdf', 'invoices/2024/12/0917627981.pdf', 'accounts@jcimining.co.za',
        '2024-12-03T07:22:00', '2024-12-03T07:23:41');
SET @docId = SCOPE_IDENTITY();

INSERT INTO InvoiceHeader (DocumentId, SupplierName, SupplierVatNumber, InvoiceNumber, InvoiceDate,
  PurchaseOrderNumber, Currency, SubtotalAmount, VatAmount, TotalAmount,
  BankName, BankAccountNumber, BankBranchCode, ExtractionConfidence)
VALUES (@docId, 'Barloworld Equipment', '4710250293', '917627981', '2024-12-02',
  'LAC2412POH00000005', 'ZAR', 1977.11, 296.57, 2273.68,
  NULL, NULL, NULL, 96.20);
SET @invId = SCOPE_IDENTITY();

INSERT INTO InvoiceLine (InvoiceHeaderId, LineNumber, Description, Quantity, UnitPrice, LineAmount) VALUES
(@invId, 1,  '7C9198 - PKG QTY5-BLOCK(BREAK) D9R',           1,    1750.86, 1750.86),
(@invId, 2,  '1A9579 - PKG QTY100-CAPSCREW(BREAK)',           3,      13.89,   41.67),
(@invId, 3,  '9M1974 - PKG QTY100-WASHER(BREAK)',             8,       9.81,   78.48),
(@invId, 4,  '5P0537 - PKG QTY100-WASHER(BREAK)',             6,       9.25,   55.50),
(@invId, 5,  '0S1615 - PKG QTY100-CAP SCREW(BREAK)',          6,       5.44,   32.64),
(@invId, 6,  '0S1618 - PKG QTY100-CAP SCREW(BREAK)',          2,       8.98,   17.96);

INSERT INTO ApprovalQueue (InvoiceHeaderId, CurrentStatus) VALUES (@invId, 'New');
SET @queueId = SCOPE_IDENTITY();
INSERT INTO ApprovalActionLog (ApprovalQueueId, ActionType, ActionBy, Comments)
VALUES (@queueId, 'Submitted', 'Logic App', 'Received: accounts@jcimining.co.za | Barloworld Equipment | Inv 917627981');

-- ============================================================
-- INVOICE 2: ITR South Africa Earthmoving – Tax Invoice 14248980
-- 36 line items, track & undercarriage rebuild
-- Date: 26/11/2024 | Total: R219,853.27
-- Bank: Investec 40005033909 | Branch 580105
-- ============================================================
INSERT INTO Document (FileName, FilePath, SourceMailbox, ReceivedDateTime, ProcessedDateTime)
VALUES ('14248980.pdf', 'invoices/2024/11/14248980.pdf', 'accounts@jcimining.co.za',
        '2024-11-27T08:45:00', '2024-11-27T08:46:22');
SET @docId = SCOPE_IDENTITY();

INSERT INTO InvoiceHeader (DocumentId, SupplierName, SupplierVatNumber, InvoiceNumber, InvoiceDate,
  PurchaseOrderNumber, Currency, SubtotalAmount, VatAmount, TotalAmount,
  BankName, BankAccountNumber, BankBranchCode, ExtractionConfidence)
VALUES (@docId, 'ITR South Africa Earthmoving (Pty) Ltd', '4320276563', '14248980', '2024-11-26',
  'LAB2411POH00000095', 'ZAR', 191176.76, 28676.51, 219853.27,
  'Investec Bank', '40005033909', '580105', 91.80);
SET @invId = SCOPE_IDENTITY();

INSERT INTO InvoiceLine (InvoiceHeaderId, LineNumber, Description, Quantity, UnitPrice, LineAmount) VALUES
(@invId, 1,  'UL240C5D43 - LINK ASSY LUBRICATED PREMIUM TYPE',     1,   115900.65, 115900.65),
(@invId, 2,  '7G0343 - TRACK NUT',                                168,      23.08,   3877.44),
(@invId, 3,  '6T2638 - TRACK BOLT',                               168,      44.82,   7529.76),
(@invId, 4,  'GB68/24 - GROUSER BAR',                               1,     564.90,    564.90),
(@invId, 5,  'UCLAB06/240DZ - REMOVE SHOES ONLY 240 PITCH DOZER',   1,    1320.00,   1320.00),
(@invId, 6,  'UCLAB01/240 - RESTRIP GROUSERS 240 PITCH',           43,     335.00,  14405.00),
(@invId, 7,  'UCLAB05/240DZ - FIT SHOES ONLY 240 PITCH DOZER',      1,    2400.00,   2400.00),
(@invId, 8,  '1D4608 - ROLLER BOLT',                               16,      40.95,    655.20),
(@invId, 9,  '7T5419 - PAD ASSY BOGIE',                             4,     676.71,   2706.84),
(@invId, 10, '9W4481 - INSERT BOGIE IDLER',                         2,     188.51,    377.02),
(@invId, 11, '5P2566 - BOLT',                                       6,      14.03,     84.18),
(@invId, 12, '3807673 - BEARING SPHERICAL',                         1,     857.80,    857.80),
(@invId, 13, '5L4751 - RING RETAINING INTERNAL',                    2,      67.60,    135.20),
(@invId, 14, '7T4865 - PIN EQUALIZER BAR',                          1,    1018.00,   1018.00),
(@invId, 15, '7T8004 - RING',                                       1,     578.45,    578.45),
(@invId, 16, '8E2819 - RING',                                       1,     574.86,    574.86),
(@invId, 17, '9X4586 - SEAL ASSY',                                  1,    1646.90,   1646.90),
(@invId, 18, '9G0296 - BEARING',                                    1,     860.67,    860.67),
(@invId, 19, '9M5894 - SEAL O RING',                                1,      21.44,     21.44),
(@invId, 20, '9X6417 - BOLT HEX HEAD',                              1,      31.70,     31.70),
(@invId, 21, '2P1692 - SEAL O RING',                                1,       6.60,      6.60),
(@invId, 22, '7T4132 - RING THRUST TRACK FRAME',                    1,     402.03,    402.03),
(@invId, 23, '7G9709 - BEARING SLEEVE',                             1,    1117.62,   1117.62),
(@invId, 24, '6Y0210 - BEARING SLEEVE',                             1,    1454.13,   1454.13),
(@invId, 25, '7X0328 - BOLT HEX HEAD',                              1,      17.93,     17.93),
(@invId, 26, '5P8245 - WASHER HARD',                                2,       0.97,      1.94),
(@invId, 27, '4D4508 - SEAL O RING',                                1,      54.38,     54.38),
(@invId, 28, '7G5221 - PLATE',                                      3,     205.46,    616.38),
(@invId, 29, '7T9307 - PIN ASSY CARTRIDGE (BOGIE)',                10,    2780.67,  27806.70),
(@invId, 30, '8C6857 - BOLT HEX HEAD',                             16,      34.18,    546.88),
(@invId, 31, '8T4994 - WASHER',                                    16,       7.14,    114.24),
(@invId, 32, '8S4755 - BOLT',                                       8,      57.20,    457.60),
(@invId, 33, '8S6251 - SEAL O RING',                                1,     141.55,    141.55),
(@invId, 34, '3G7016 - PIN',                                        1,     796.76,    796.76),
(@invId, 35, '4T7534 - PIN',                                        2,    1023.13,   2046.26),
(@invId, 36, '8T4122 - WASHER',                                     5,       9.95,     49.75);

INSERT INTO ApprovalQueue (InvoiceHeaderId, CurrentStatus) VALUES (@invId, 'New');
SET @queueId = SCOPE_IDENTITY();
INSERT INTO ApprovalActionLog (ApprovalQueueId, ActionType, ActionBy, Comments)
VALUES (@queueId, 'Submitted', 'Logic App', 'Received: accounts@jcimining.co.za | ITR South Africa | Inv 14248980');

-- ============================================================
-- INVOICE 3: Hitachi Construction Machinery – CINV000078936
-- 6 line items, bearings/seals/shims/plate
-- Date: 21/06/2024 | Total: R8,427.05
-- Bank: FNB 55121243758
-- ============================================================
INSERT INTO Document (FileName, FilePath, SourceMailbox, ReceivedDateTime, ProcessedDateTime)
VALUES ('20240624094208702_CINV000078936.pdf', 'invoices/2024/06/CINV000078936.pdf', 'accounts@jcimining.co.za',
        '2024-06-24T09:42:08', '2024-06-24T09:43:11');
SET @docId = SCOPE_IDENTITY();

INSERT INTO InvoiceHeader (DocumentId, SupplierName, SupplierVatNumber, InvoiceNumber, InvoiceDate,
  PurchaseOrderNumber, Currency, SubtotalAmount, VatAmount, TotalAmount,
  BankName, BankAccountNumber, BankBranchCode, ExtractionConfidence)
VALUES (@docId, 'Hitachi Construction Machinery SA Co. (Pty) Ltd', '4050105008', 'CINV000078936', '2024-06-21',
  'RIS2406POH00000108', 'ZAR', 7327.87, 1099.18, 8427.05,
  'FNB', '55121243758', NULL, 93.50);
SET @invId = SCOPE_IDENTITY();

INSERT INTO InvoiceLine (InvoiceHeaderId, LineNumber, Description, Quantity, UnitPrice, LineAmount) VALUES
(@invId, 1, 'E4018962 - BEARING (SASH-000991803)',                             1, 2771.18, 2771.18),
(@invId, 2, 'E12596100 - SEAL 8484.20-0000 (SASH-000991803)',                  1, 2338.15, 2338.15),
(@invId, 3, 'E4018957 - SHIM 7326.90-8588 (SASH-000991803)',                   1,   95.97,   95.97),
(@invId, 4, 'E4018956 - SHIM 7326.90-8588 (SASH-000991803)',                   2,   73.65,  147.29),
(@invId, 5, 'E4049273 - GASKET 5911.90-0080 (SASH-000991803)',                 2,  214.20,  428.40),
(@invId, 6, 'E4018965 - PLATE 8708.29-5060 (SASH-000991803)',                  1, 1546.88, 1546.88);

INSERT INTO ApprovalQueue (InvoiceHeaderId, CurrentStatus) VALUES (@invId, 'New');
SET @queueId = SCOPE_IDENTITY();
INSERT INTO ApprovalActionLog (ApprovalQueueId, ActionType, ActionBy, Comments)
VALUES (@queueId, 'Submitted', 'Logic App', 'Received: accounts@jcimining.co.za | Hitachi | Inv CINV000078936');

-- ============================================================
-- INVOICE 4: Hitachi Construction Machinery – CINV000078995
-- 1 line item, water hose
-- Date: 21/06/2024 | Total: R3,566.64
-- Bank: FNB 55121243758
-- ============================================================
INSERT INTO Document (FileName, FilePath, SourceMailbox, ReceivedDateTime, ProcessedDateTime)
VALUES ('20240624094208702_CINV000078995.pdf', 'invoices/2024/06/CINV000078995.pdf', 'accounts@jcimining.co.za',
        '2024-06-24T09:42:08', '2024-06-24T09:43:45');
SET @docId = SCOPE_IDENTITY();

INSERT INTO InvoiceHeader (DocumentId, SupplierName, SupplierVatNumber, InvoiceNumber, InvoiceDate,
  PurchaseOrderNumber, Currency, SubtotalAmount, VatAmount, TotalAmount,
  BankName, BankAccountNumber, BankBranchCode, ExtractionConfidence)
VALUES (@docId, 'Hitachi Construction Machinery SA Co. (Pty) Ltd', '4050105008', 'CINV000078995', '2024-06-21',
  'LAC2406POH00000075', 'ZAR', 3101.43, 465.21, 3566.64,
  'FNB', '55121243758', NULL, 93.50);
SET @invId = SCOPE_IDENTITY();

INSERT INTO InvoiceLine (InvoiceHeaderId, LineNumber, Description, Quantity, UnitPrice, LineAmount) VALUES
(@invId, 1, '3089943 - HOSE;WATER 4009.42-0004 (SASH-000991868)', 1, 3101.43, 3101.43);

INSERT INTO ApprovalQueue (InvoiceHeaderId, CurrentStatus) VALUES (@invId, 'New');
SET @queueId = SCOPE_IDENTITY();
INSERT INTO ApprovalActionLog (ApprovalQueueId, ActionType, ActionBy, Comments)
VALUES (@queueId, 'Submitted', 'Logic App', 'Received: accounts@jcimining.co.za | Hitachi | Inv CINV000078995');

-- ============================================================
-- INVOICE 5: Hitachi Construction Machinery – CINV000078909
-- 1 line item, V-belt
-- Date: 21/06/2024 | Total: R1,164.12
-- Bank: FNB 55121243758
-- ============================================================
INSERT INTO Document (FileName, FilePath, SourceMailbox, ReceivedDateTime, ProcessedDateTime)
VALUES ('20240624094208702_CINV000078909.pdf', 'invoices/2024/06/CINV000078909.pdf', 'accounts@jcimining.co.za',
        '2024-06-24T09:42:08', '2024-06-24T09:44:02');
SET @docId = SCOPE_IDENTITY();

INSERT INTO InvoiceHeader (DocumentId, SupplierName, SupplierVatNumber, InvoiceNumber, InvoiceDate,
  PurchaseOrderNumber, Currency, SubtotalAmount, VatAmount, TotalAmount,
  BankName, BankAccountNumber, BankBranchCode, ExtractionConfidence)
VALUES (@docId, 'Hitachi Construction Machinery SA Co. (Pty) Ltd', '4050105008', 'CINV000078909', '2024-06-21',
  'LAC2406POH00000097', 'ZAR', 1012.28, 151.84, 1164.12,
  'FNB', '55121243758', NULL, 93.50);
SET @invId = SCOPE_IDENTITY();

INSERT INTO InvoiceLine (InvoiceHeaderId, LineNumber, Description, Quantity, UnitPrice, LineAmount) VALUES
(@invId, 1, '4612763 - BELT;V 4010.31-0006 (SASH-000991793)', 1, 1012.28, 1012.28);

INSERT INTO ApprovalQueue (InvoiceHeaderId, CurrentStatus) VALUES (@invId, 'New');
SET @queueId = SCOPE_IDENTITY();
INSERT INTO ApprovalActionLog (ApprovalQueueId, ActionType, ActionBy, Comments)
VALUES (@queueId, 'Submitted', 'Logic App', 'Received: accounts@jcimining.co.za | Hitachi | Inv CINV000078909');

-- ============================================================
-- INVOICE 6: Alfagomma HYD & IND Services – Invoice 40404646
-- 5 line items, hydraulic hoses & fittings
-- Date: 15/03/2024 | Total: R8,803.45
-- Bank: ABSA 4081049906 | Branch 632005
-- ============================================================
INSERT INTO Document (FileName, FilePath, SourceMailbox, ReceivedDateTime, ProcessedDateTime)
VALUES ('JCI 40404646.pdf', 'invoices/2024/03/JCI_40404646.pdf', 'accounts@jcimining.co.za',
        '2024-03-15T14:05:00', '2024-03-15T14:06:18');
SET @docId = SCOPE_IDENTITY();

INSERT INTO InvoiceHeader (DocumentId, SupplierName, SupplierVatNumber, InvoiceNumber, InvoiceDate,
  PurchaseOrderNumber, Currency, SubtotalAmount, VatAmount, TotalAmount,
  BankName, BankAccountNumber, BankBranchCode, ExtractionConfidence)
VALUES (@docId, 'Alfagomma HYD & IND Services SA (Pty)', '4450263241', '40404646', '2024-03-15',
  'JCI86697', 'ZAR', 7655.17, 1148.28, 8803.45,
  'ABSA Bank Limited', '4081049906', '632005', 95.10);
SET @invId = SCOPE_IDENTITY();

INSERT INTO InvoiceLine (InvoiceHeaderId, LineNumber, Description, Quantity, UnitPrice, LineAmount) VALUES
(@invId, 1, 'E6KAA03200F6C8 - HH-E6K-6S EVOLUTION MT-20 DN032 AG R15-20 HYDRAULIC HOSE', 2.10, 1914.70, 4020.87),
(@invId, 2, 'H1400301-200000 - HFF-IL DSK-301-20 HYDRAULIC FITTING',                      2,    552.10, 1104.20),
(@invId, 3, 'H144361T-202000 - HFF-IL FL 6K-20-20 HYDRAULIC FITTING',                     2,    712.80, 1425.60),
(@invId, 4, 'DW-20 - DOWTY WASHER',                                                        2,     37.90,   75.80),
(@invId, 5, 'R1S0033-0484000 - COIL SPRING-20 HOSE PROTECTOR',                             3,    342.90, 1028.70);

INSERT INTO ApprovalQueue (InvoiceHeaderId, CurrentStatus) VALUES (@invId, 'New');
SET @queueId = SCOPE_IDENTITY();
INSERT INTO ApprovalActionLog (ApprovalQueueId, ActionType, ActionBy, Comments)
VALUES (@queueId, 'Submitted', 'Logic App', 'Received: accounts@jcimining.co.za | Alfagomma | Inv 40404646');

-- ============================================================
-- INVOICE 7: Babcock Africa Services – Tax Invoice 90975321
-- 7 line items, Volvo ADT fleet service agreement Dec 2024
-- Date: 20/12/2024 | Total: R63,230.51
-- Bank: RMB Corporate Bank 58860017575 | Branch 255005
-- ============================================================
INSERT INTO Document (FileName, FilePath, SourceMailbox, ReceivedDateTime, ProcessedDateTime)
VALUES ('JCI invoice dec 24 head office.pdf', 'invoices/2024/12/JCI_invoice_dec24_head_office.pdf', 'accounts@jcimining.co.za',
        '2024-12-21T06:30:00', '2024-12-21T06:31:09');
SET @docId = SCOPE_IDENTITY();

INSERT INTO InvoiceHeader (DocumentId, SupplierName, SupplierVatNumber, InvoiceNumber, InvoiceDate,
  PurchaseOrderNumber, Currency, SubtotalAmount, VatAmount, TotalAmount,
  BankName, BankAccountNumber, BankBranchCode, ExtractionConfidence)
VALUES (@docId, 'Babcock Africa Services (Pty) Ltd', '4440150169', '90975321', '2024-12-20',
  'SERV-BABCOCK-2024', 'ZAR', 54983.05, 8247.46, 63230.51,
  'RMB Corporate Bank', '58860017575', '255005', 97.30);
SET @invId = SCOPE_IDENTITY();

INSERT INTO InvoiceLine (InvoiceHeaderId, LineNumber, Description, Quantity, UnitPrice, LineAmount) VALUES
(@invId, 1,  'V320098 CJCI172 - A30F Fleet Service (0.000 hrs × R44.07)',    0,    44.07,     0.00),
(@invId, 2,  'V320099 CJCI173 - A30F Fleet Service (0.000 hrs × R44.07)',    0,    44.07,     0.00),
(@invId, 3,  'V320100 CJCI174 - A30F Fleet Service (0.000 hrs × R44.07)',    0,    44.07,     0.00),
(@invId, 4,  'V320561 CJCI182 - A40F Fleet Service (237.000 hrs × R55.95)', 237,   55.95, 13260.15),
(@invId, 5,  'V323290 CJCI1207 - A40G Fleet Service (1.000 hrs × R56.63)',    1,   56.63,    56.63),
(@invId, 6,  'V324819 CJCI1227 - A40G Fleet Service (435.000 hrs × R48.37)', 435,  48.37, 21040.95),
(@invId, 7,  'V332137 CJC1221 - A45G Fleet Service (428.000 hrs × R48.19)',  428,  48.19, 20625.32);

INSERT INTO ApprovalQueue (InvoiceHeaderId, CurrentStatus) VALUES (@invId, 'New');
SET @queueId = SCOPE_IDENTITY();
INSERT INTO ApprovalActionLog (ApprovalQueueId, ActionType, ActionBy, Comments)
VALUES (@queueId, 'Submitted', 'Logic App', 'Received: accounts@jcimining.co.za | Babcock Africa Services | Inv 90975321');

-- ============================================================
-- INVOICE 8: Easy Flow Diesel – Tax Invoice EA952871
-- 1 line item, Shell Diesel 50ppm – 107L @ R21.60
-- Date: 21/02/2025 | Total: R2,311.20 (zero-rated fuel)
-- Bank: ABSA 4048709319 | Branch 632005
-- ============================================================
INSERT INTO Document (FileName, FilePath, SourceMailbox, ReceivedDateTime, ProcessedDateTime)
VALUES ('Tax Invoice EA952871.PDF', 'invoices/2025/02/EA952871.pdf', 'accounts@jcimining.co.za',
        '2025-02-21T11:15:00', '2025-02-21T11:15:52');
SET @docId = SCOPE_IDENTITY();

INSERT INTO InvoiceHeader (DocumentId, SupplierName, SupplierVatNumber, InvoiceNumber, InvoiceDate,
  PurchaseOrderNumber, Currency, SubtotalAmount, VatAmount, TotalAmount,
  BankName, BankAccountNumber, BankBranchCode, ExtractionConfidence)
VALUES (@docId, 'Easy Flow Diesel (Pty) Ltd', '4290185273', 'EA952871', '2025-02-21',
  'A738740', 'ZAR', 2311.20, 0.00, 2311.20,
  'ABSA', '4048709319', '632005', 98.70);
SET @invId = SCOPE_IDENTITY();

INSERT INTO InvoiceLine (InvoiceHeaderId, LineNumber, Description, Quantity, UnitPrice, LineAmount) VALUES
(@invId, 1, '400003155 - SHELL DIESEL EXTRA LOW SULPHUR 50ppm | REG KLG088MP ODO 164875', 107, 21.60, 2311.20);

INSERT INTO ApprovalQueue (InvoiceHeaderId, CurrentStatus) VALUES (@invId, 'New');
SET @queueId = SCOPE_IDENTITY();
INSERT INTO ApprovalActionLog (ApprovalQueueId, ActionType, ActionBy, Comments)
VALUES (@queueId, 'Submitted', 'Logic App', 'Received: accounts@jcimining.co.za | Easy Flow Diesel | Inv EA952871');

-- ============================================================
-- INVOICE 9: Easy Flow Diesel – Tax Invoice EA954054
-- 1 line item, Shell Diesel 50ppm – 43.94L @ R21.60
-- Date: 28/02/2025 | Total: R949.10 (zero-rated fuel)
-- Bank: ABSA 4048709319 | Branch 632005
-- ============================================================
INSERT INTO Document (FileName, FilePath, SourceMailbox, ReceivedDateTime, ProcessedDateTime)
VALUES ('Tax Invoice EA954054.PDF', 'invoices/2025/02/EA954054.pdf', 'accounts@jcimining.co.za',
        '2025-02-28T09:55:00', '2025-02-28T09:55:44');
SET @docId = SCOPE_IDENTITY();

INSERT INTO InvoiceHeader (DocumentId, SupplierName, SupplierVatNumber, InvoiceNumber, InvoiceDate,
  PurchaseOrderNumber, Currency, SubtotalAmount, VatAmount, TotalAmount,
  BankName, BankAccountNumber, BankBranchCode, ExtractionConfidence)
VALUES (@docId, 'Easy Flow Diesel (Pty) Ltd', '4290185273', 'EA954054', '2025-02-28',
  'C339745', 'ZAR', 949.10, 0.00, 949.10,
  'ABSA', '4048709319', '632005', 98.70);
SET @invId = SCOPE_IDENTITY();

INSERT INTO InvoiceLine (InvoiceHeaderId, LineNumber, Description, Quantity, UnitPrice, LineAmount) VALUES
(@invId, 1, '400003155 - SHELL DIESEL EXTRA LOW SULPHUR 50ppm | REG KMT723MP ODO 151116', 43.94, 21.60, 949.10);

INSERT INTO ApprovalQueue (InvoiceHeaderId, CurrentStatus) VALUES (@invId, 'New');
SET @queueId = SCOPE_IDENTITY();
INSERT INTO ApprovalActionLog (ApprovalQueueId, ActionType, ActionBy, Comments)
VALUES (@queueId, 'Submitted', 'Logic App', 'Received: accounts@jcimining.co.za | Easy Flow Diesel | Inv EA954054');

-- ============================================================
-- SUMMARY CHECK
-- ============================================================
SELECT 'Suppliers'  AS Entity, COUNT(*) AS [Count] FROM SupplierMaster  UNION ALL
SELECT 'POs',                  COUNT(*)             FROM PurchaseOrderMaster UNION ALL
SELECT 'PO Lines',             COUNT(*)             FROM PurchaseOrderLine UNION ALL
SELECT 'Documents',            COUNT(*)             FROM Document UNION ALL
SELECT 'Invoice Headers',      COUNT(*)             FROM InvoiceHeader UNION ALL
SELECT 'Invoice Lines',        COUNT(*)             FROM InvoiceLine UNION ALL
SELECT 'Approval Queue',       COUNT(*)             FROM ApprovalQueue UNION ALL
SELECT 'Audit Log',            COUNT(*)             FROM ApprovalActionLog;
