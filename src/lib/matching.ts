import { query, execute } from './db';
import type { InvoiceHeader } from '@/types';

interface MatchResultData {
  supplierMatch: boolean;
  poMatch: boolean;
  amountMatch: boolean;
  bankMatch: boolean;
  duplicateFlag: boolean;
  matchScore: number;
  matchStatus: string;
  matchReason: string;
  matchedSupplierId: number | null;
  matchedPoId: number | null;
}

export async function runMatching(invoiceHeaderId: number): Promise<MatchResultData> {
  // Fetch the invoice
  const invoices = await query<InvoiceHeader[]>(
    `SELECT * FROM InvoiceHeader WHERE InvoiceHeaderId = @id`,
    { id: invoiceHeaderId }
  );
  const invoice = invoices[0];
  if (!invoice) throw new Error(`Invoice ${invoiceHeaderId} not found`);

  const reasons: string[] = [];
  let supplierMatch = false;
  let poMatch = false;
  let amountMatch = false;
  let bankMatch = false;
  let bankDataAvailable = false; // true only when both sides have a bank account to compare
  let duplicateFlag = false;
  let matchedSupplierId: number | null = null;
  let matchedPoId: number | null = null;

  // 1. Supplier match — by VAT number first, then name similarity
  const suppliers = await query<{ SupplierId: number; SupplierCode: string; BankAccountNumber: string | null }[]>(
    `SELECT TOP 1 SupplierId, SupplierCode, BankAccountNumber
     FROM SupplierMaster
     WHERE IsActive = 1
       AND (
         (@vatNum IS NOT NULL AND SupplierVatNumber = @vatNum)
         OR SupplierName = @name
       )`,
    {
      vatNum: invoice.SupplierVatNumber ?? null,
      name:   invoice.SupplierName ?? '',
    }
  );

  if (suppliers.length > 0) {
    supplierMatch = true;
    matchedSupplierId = suppliers[0].SupplierId;
    reasons.push('Supplier matched in SupplierMaster');

    // 4. Bank match — compare invoice bank account vs supplier master
    if (invoice.BankAccountNumber && suppliers[0].BankAccountNumber) {
      bankDataAvailable = true;
      bankMatch = invoice.BankAccountNumber.replace(/\s/g, '') ===
                  suppliers[0].BankAccountNumber.replace(/\s/g, '');
      reasons.push(bankMatch
        ? 'Bank account matches supplier record'
        : 'BANK ACCOUNT MISMATCH — possible fraud risk');
    } else {
      reasons.push('Bank account not available for comparison');
    }
  } else {
    reasons.push(`Supplier "${invoice.SupplierName}" not found in SupplierMaster`);
    reasons.push('Bank match skipped — supplier not found');
  }

  // 2. PO match — by PO number
  if (invoice.PurchaseOrderNumber) {
    const pos = await query<{ PurchaseOrderId: number; RemainingAmount: number | null; SupplierCode: string }[]>(
      `SELECT TOP 1 PurchaseOrderId, RemainingAmount, SupplierCode
       FROM PurchaseOrderMaster
       WHERE PurchaseOrderNumber = @poNum
         AND Status != 'Closed'`,
      { poNum: invoice.PurchaseOrderNumber }
    );

    if (pos.length > 0) {
      poMatch = true;
      matchedPoId = pos[0].PurchaseOrderId;
      reasons.push(`PO ${invoice.PurchaseOrderNumber} found`);

      // 3. Amount match — invoice total vs PO remaining (within 1%)
      const remaining = pos[0].RemainingAmount;
      const total = invoice.TotalAmount;
      if (remaining != null && total != null) {
        const diff = Math.abs(remaining - total);
        const tolerance = remaining * 0.01;
        amountMatch = diff <= tolerance;
        reasons.push(amountMatch
          ? `Amount matches PO remaining (R${remaining?.toFixed(2)})`
          : `Amount mismatch: invoice R${total?.toFixed(2)} vs PO remaining R${remaining?.toFixed(2)}`);
      } else {
        reasons.push('Amount comparison skipped — missing values');
      }
    } else {
      reasons.push(`PO ${invoice.PurchaseOrderNumber} not found or closed`);
    }
  } else {
    reasons.push('No PO number on invoice — PO match skipped');
  }

  // 5. Duplicate check — same supplier + invoice number already Approved or Exported
  const dupes = await query<{ cnt: number }[]>(
    `SELECT COUNT(*) AS cnt
     FROM InvoiceHeader ih
     JOIN ApprovalQueue aq ON aq.InvoiceHeaderId = ih.InvoiceHeaderId
     WHERE ih.SupplierName = @name
       AND ih.InvoiceNumber = @invNum
       AND ih.InvoiceHeaderId != @id
       AND aq.CurrentStatus IN ('Approved', 'Exported')`,
    {
      name:   invoice.SupplierName ?? '',
      invNum: invoice.InvoiceNumber ?? '',
      id:     invoiceHeaderId,
    }
  );
  duplicateFlag = (dupes[0]?.cnt ?? 0) > 0;
  if (duplicateFlag) reasons.push('DUPLICATE: same invoice number already approved/exported');

  // Score calculation: each check worth 20 points
  const checks = [supplierMatch, poMatch, amountMatch, bankMatch, !duplicateFlag];
  const matchScore = checks.filter(Boolean).length * 20;

  let matchStatus: string;
  if (duplicateFlag || (!bankMatch && supplierMatch && bankDataAvailable)) {
    matchStatus = matchScore < 40 ? 'FraudRisk' : 'NeedsReview';
    if (duplicateFlag) matchStatus = 'FraudRisk';
    if (!bankMatch && supplierMatch && bankDataAvailable) matchStatus = 'FraudRisk';
  } else if (matchScore >= 80) {
    matchStatus = 'Matched';
  } else if (matchScore >= 40) {
    matchStatus = 'NeedsReview';
  } else {
    matchStatus = 'NeedsReview';
  }

  const matchReason = reasons.join(' | ');

  // Upsert InvoiceMatchResult
  const existing = await query<{ InvoiceMatchResultId: number }[]>(
    `SELECT InvoiceMatchResultId FROM InvoiceMatchResult WHERE InvoiceHeaderId = @id`,
    { id: invoiceHeaderId }
  );

  if (existing.length > 0) {
    await execute(
      `UPDATE InvoiceMatchResult SET
         SupplierMatchFlag = @sup, PoMatchFlag = @po, AmountMatchFlag = @amt,
         BankMatchFlag = @bank, DuplicateInvoiceFlag = @dup,
         MatchStatus = @status, MatchScore = @score, MatchReason = @reason,
         MatchedSupplierId = @suppId, MatchedPoId = @poId,
         CreatedDateTime = GETUTCDATE()
       WHERE InvoiceHeaderId = @id`,
      {
        sup: supplierMatch, po: poMatch, amt: amountMatch, bank: bankMatch,
        dup: duplicateFlag, status: matchStatus,
        score: matchScore,
        reason: matchReason,
        suppId: matchedSupplierId ? matchedSupplierId : null,
        poId: matchedPoId ? matchedPoId : null,
        id: invoiceHeaderId,
      }
    );
  } else {
    await execute(
      `INSERT INTO InvoiceMatchResult
         (InvoiceHeaderId, SupplierMatchFlag, PoMatchFlag, AmountMatchFlag,
          BankMatchFlag, DuplicateInvoiceFlag, MatchStatus, MatchScore,
          MatchReason, MatchedSupplierId, MatchedPoId)
       VALUES
         (@id, @sup, @po, @amt, @bank, @dup, @status, @score, @reason, @suppId, @poId)`,
      {
        id: invoiceHeaderId,
        sup: supplierMatch, po: poMatch, amt: amountMatch, bank: bankMatch,
        dup: duplicateFlag, status: matchStatus,
        score: matchScore,
        reason: matchReason,
        suppId: matchedSupplierId ? matchedSupplierId : null,
        poId: matchedPoId ? matchedPoId : null,
      }
    );
  }

  // Update ApprovalQueue status if currently New or Matched/NeedsReview
  await execute(
    `UPDATE ApprovalQueue
     SET CurrentStatus = @status, UpdatedDateTime = GETUTCDATE()
     WHERE InvoiceHeaderId = @id
       AND CurrentStatus IN ('New', 'Matched', 'NeedsReview', 'FraudRisk')`,
    {
      status: matchStatus,
      id: invoiceHeaderId,
    }
  );

  return { supplierMatch, poMatch, amountMatch, bankMatch, duplicateFlag,
           matchScore, matchStatus, matchReason, matchedSupplierId, matchedPoId };
}
