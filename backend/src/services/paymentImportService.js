/**
 * Payment Import Service
 * Import payments from bank statements (CSV/Excel)
 * Supports Vietnamese banks: VCB, TCB, BIDV, and generic format
 */

import * as XLSX from 'xlsx';

const BANK_FORMATS = {
  vcb: {
    dateCol: 'Ngày GD',
    amountCol: 'Số tiền',
    descCol: 'Nội dung',
    refCol: 'Số tham chiếu',
    dateFormat: 'DD/MM/YYYY'
  },
  tcb: {
    dateCol: 'Ngày giao dịch',
    amountCol: 'Số tiền ghi có',
    descCol: 'Mô tả',
    refCol: 'Mã giao dịch',
    dateFormat: 'DD/MM/YYYY'
  },
  bidv: {
    dateCol: 'Ngày',
    amountCol: 'Ghi có',
    descCol: 'Diễn giải',
    refCol: 'Số CT',
    dateFormat: 'DD/MM/YYYY'
  },
  generic: {
    dateCol: 'date',
    amountCol: 'amount',
    descCol: 'description',
    refCol: 'reference',
    dateFormat: 'YYYY-MM-DD'
  }
};

const INVOICE_CODE_PATTERN = /INV-\d{8}-\d{4}/gi;
const PHONE_PATTERN = /0\d{9,10}/g;
const AMOUNT_CLEAN_PATTERN = /[,.\s]/g;

/**
 * Parse bank statement from CSV/Excel
 * @param {Buffer} fileBuffer - File content
 * @param {string} fileType - 'csv' or 'xlsx'
 * @param {string} bankFormat - 'vcb' | 'tcb' | 'bidv' | 'generic'
 * @returns {Array} Parsed transactions
 */
export async function parseBankStatement(fileBuffer, fileType, bankFormat) {
  try {
    const format = BANK_FORMATS[bankFormat] || BANK_FORMATS.generic;
    
    const workbook = XLSX.read(fileBuffer, {
      type: 'buffer',
      cellDates: true,
      dateNF: format.dateFormat
    });
    
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    
    if (!rawData.length) {
      throw new Error('File không có dữ liệu');
    }

    const transactions = rawData
      .map((row, index) => parseTransactionRow(row, format, index))
      .filter(tx => tx !== null && tx.amount > 0);

    return {
      success: true,
      data: transactions,
      total: transactions.length,
      message: `Đã parse ${transactions.length} giao dịch từ file`
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      total: 0,
      message: `Lỗi parse file: ${error.message}`
    };
  }
}

function parseTransactionRow(row, format, index) {
  try {
    const dateValue = row[format.dateCol] || findColumnValue(row, ['date', 'ngày', 'ngay']);
    const amountValue = row[format.amountCol] || findColumnValue(row, ['amount', 'số tiền', 'so tien', 'ghi có', 'ghi co']);
    const descValue = row[format.descCol] || findColumnValue(row, ['description', 'nội dung', 'noi dung', 'diễn giải', 'dien giai', 'mô tả', 'mo ta']);
    const refValue = row[format.refCol] || findColumnValue(row, ['reference', 'ref', 'mã gd', 'ma gd', 'số tham chiếu']);

    const amount = parseAmount(amountValue);
    if (!amount || amount <= 0) return null;

    const date = parseDate(dateValue);
    const description = String(descValue || '').trim();
    
    const invoiceCodes = description.match(INVOICE_CODE_PATTERN) || [];
    const phoneNumbers = description.match(PHONE_PATTERN) || [];

    return {
      id: `txn-${index + 2}`,
      rowIndex: index + 2,
      date,
      amount,
      description,
      reference: String(refValue || '').trim(),
      extractedInvoiceCodes: invoiceCodes.map(c => c.toUpperCase()),
      extractedPhoneNumbers: phoneNumbers,
      rawData: row
    };
  } catch {
    return null;
  }
}

function findColumnValue(row, possibleNames) {
  const keys = Object.keys(row);
  for (const name of possibleNames) {
    const found = keys.find(k => k.toLowerCase().includes(name.toLowerCase()));
    if (found && row[found] !== undefined && row[found] !== '') {
      return row[found];
    }
  }
  return null;
}

function parseAmount(value) {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const cleaned = String(value).replace(AMOUNT_CLEAN_PATTERN, '').replace(/[^\d-]/g, '');
  return parseInt(cleaned, 10) || 0;
}

function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().split('T')[0];
  
  const str = String(value).trim();
  
  const ddmmyyyy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  const yyyymmdd = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (yyyymmdd) {
    const [, year, month, day] = yyyymmdd;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed.toISOString().split('T')[0];
}

/**
 * Auto-match transactions with invoices
 * @param {Array} transactions - Parsed bank transactions
 * @param {Object} supabase - Supabase client
 * @returns {Array} Matched results with confidence score
 */
export async function matchTransactionsWithInvoices(transactions, supabase, options = {}) {
  try {
    const { effectiveCenterId = null } = options;

    const { data: invoices, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_code,
        student_id,
        final_amount,
        paid_amount,
        status,
        class:classes!invoices_class_id_fkey(id, center_id),
        student:users!invoices_student_id_fkey(id, full_name, phone, center_id)
      `)
      .in('status', ['unpaid', 'partial'])
      .order('created_at', { ascending: false });

    if (invoiceError) {
      throw new Error(`Lỗi truy vấn hóa đơn: ${invoiceError.message}`);
    }

    let candidateInvoices = invoices || [];
    if (effectiveCenterId) {
      candidateInvoices = candidateInvoices.filter((invoice) => {
        const invoiceCenterId = invoice.class?.center_id || invoice.student?.center_id || null;
        return invoiceCenterId === effectiveCenterId;
      });
    }

    const results = transactions.map(tx => matchSingleTransaction(tx, candidateInvoices));

    const summary = {
      total: results.length,
      highConfidence: results.filter(r => r.confidence === 'high').length,
      mediumConfidence: results.filter(r => r.confidence === 'medium').length,
      lowConfidence: results.filter(r => r.confidence === 'low').length,
      noMatch: results.filter(r => r.confidence === 'none').length
    };

    return {
      success: true,
      data: results,
      summary,
      message: `Đã match ${summary.highConfidence + summary.mediumConfidence} giao dịch với độ tin cậy cao/trung bình`
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      summary: null,
      message: `Lỗi matching: ${error.message}`
    };
  }
}

function matchSingleTransaction(transaction, invoices) {
  const matches = [];

  for (const invoice of invoices) {
    const remainingAmount = invoice.final_amount - (invoice.paid_amount || 0);
    if (remainingAmount <= 0) continue;

    let confidence = 'none';
    let matchReasons = [];

    if (transaction.extractedInvoiceCodes.includes(invoice.invoice_code)) {
      confidence = 'high';
      matchReasons.push(`Mã hóa đơn khớp: ${invoice.invoice_code}`);
    }

    const studentName = invoice.student?.full_name || '';
    const studentPhone = invoice.student?.phone || '';

    if (confidence !== 'high' && studentPhone && transaction.extractedPhoneNumbers.includes(studentPhone)) {
      if (Math.abs(transaction.amount - remainingAmount) <= 1000) {
        confidence = 'high';
        matchReasons.push(`SĐT khớp: ${studentPhone}, số tiền khớp`);
      } else {
        confidence = confidence === 'none' ? 'medium' : confidence;
        matchReasons.push(`SĐT khớp: ${studentPhone}`);
      }
    }

    if (confidence !== 'high' && studentName) {
      const nameMatch = checkNameInDescription(studentName, transaction.description);
      if (nameMatch) {
        if (Math.abs(transaction.amount - remainingAmount) <= 1000) {
          confidence = confidence === 'none' ? 'high' : confidence;
          matchReasons.push(`Tên học viên khớp: ${studentName}, số tiền khớp`);
        } else {
          confidence = confidence === 'none' ? 'medium' : confidence;
          matchReasons.push(`Tên học viên khớp: ${studentName}`);
        }
      }
    }

    if (confidence === 'none' && Math.abs(transaction.amount - remainingAmount) <= 1000) {
      confidence = 'low';
      matchReasons.push(`Số tiền khớp: ${remainingAmount.toLocaleString()}đ`);
    }

    if (confidence !== 'none') {
      matches.push({
        invoice,
        confidence,
        matchReasons,
        remainingAmount
      });
    }
  }

  matches.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.confidence] - order[b.confidence];
  });

  const bestMatch = matches[0] || null;

  return {
    transactionId: transaction.id,
    transaction,
    matchedInvoice: bestMatch?.invoice || null,
    confidence: bestMatch?.confidence || 'none',
    matchReasons: bestMatch?.matchReasons || [],
    remainingAmount: bestMatch?.remainingAmount || 0,
    alternativeMatches: matches.slice(1, 4)
  };
}

function checkNameInDescription(fullName, description) {
  if (!fullName || !description) return false;

  const normalizedDesc = removeVietnameseTones(description.toLowerCase());
  const normalizedName = removeVietnameseTones(fullName.toLowerCase());

  if (normalizedDesc.includes(normalizedName)) return true;

  const nameParts = normalizedName.split(/\s+/).filter(p => p.length > 1);
  const lastName = nameParts[nameParts.length - 1];
  const firstName = nameParts[0];

  if (lastName && normalizedDesc.includes(lastName)) {
    if (nameParts.length <= 2) return true;
    if (firstName && normalizedDesc.includes(firstName)) return true;
  }

  return false;
}

function removeVietnameseTones(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * Apply matched payments to invoices
 * @param {Array} matches - Matched transactions
 * @param {Object} supabase - Supabase client
 * @param {UUID} userId - User applying the payments
 * @returns {Object} { applied: X, failed: Y, details: [...] }
 */
export async function applyMatchedPayments(matches, supabase, userId, options = {}) {
  const { effectiveCenterId = null } = options;
  const results = {
    applied: 0,
    failed: 0,
    skipped: 0,
    details: []
  };

  const validMatches = matches.filter(m =>
    m.matchedInvoice &&
    ['high', 'medium', 'manual'].includes(m.confidence) &&
    m.transaction?.amount > 0
  );

  for (const match of validMatches) {
    const result = await applySinglePayment(match, supabase, userId, { effectiveCenterId });
    results.details.push(result);

    if (result.success) {
      results.applied++;
    } else if (result.skipped) {
      results.skipped++;
    } else {
      results.failed++;
    }
  }

  const skippedLowConfidence = matches.filter(m =>
    m.confidence === 'low' || m.confidence === 'none'
  ).length;

  return {
    success: true,
    ...results,
    skippedLowConfidence,
    message: `Đã áp dụng ${results.applied} thanh toán, ${results.failed} thất bại, ${results.skipped + skippedLowConfidence} bỏ qua`
  };
}

async function applySinglePayment(match, supabase, userId, options = {}) {
  const { effectiveCenterId = null } = options;
  const { transaction, matchedInvoice, confidence, matchReasons } = match;

  try {
    const { data: currentInvoice, error: fetchError } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_code,
        final_amount,
        paid_amount,
        status,
        class:classes!invoices_class_id_fkey(center_id),
        student:users!invoices_student_id_fkey(center_id)
      `)
      .eq('id', matchedInvoice.id)
      .single();

    if (fetchError || !currentInvoice) {
      return {
        success: false,
        skipped: false,
        transaction,
        invoiceCode: matchedInvoice.invoice_code,
        error: 'Không tìm thấy hóa đơn'
      };
    }

    const invoiceCenterId = currentInvoice.class?.center_id || currentInvoice.student?.center_id || null;
    if (effectiveCenterId && invoiceCenterId !== effectiveCenterId) {
      return {
        success: false,
        skipped: false,
        transaction,
        invoiceCode: matchedInvoice.invoice_code,
        error: 'Không có quyền áp dụng thanh toán cho hóa đơn ngoài trung tâm của bạn'
      };
    }

    if (currentInvoice.status === 'paid') {
      return {
        success: false,
        skipped: true,
        transaction,
        invoiceCode: currentInvoice.invoice_code,
        error: 'Hóa đơn đã thanh toán đủ'
      };
    }

    const remainingAmount = currentInvoice.final_amount - (currentInvoice.paid_amount || 0);
    const paymentAmount = Math.min(transaction.amount, remainingAmount);

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        invoice_id: currentInvoice.id,
        amount: paymentAmount,
        payment_method: 'bank_transfer',
        verification_status: 'pending',
        reference_code: transaction.reference || null,
        notes: buildPaymentNotes(transaction, confidence, matchReasons),
        received_by: userId,
        payment_date: transaction.date ? new Date(transaction.date).toISOString() : new Date().toISOString()
      })
      .select()
      .single();

    if (paymentError) {
      return {
        success: false,
        skipped: false,
        transaction,
        invoiceCode: currentInvoice.invoice_code,
        error: `Lỗi tạo payment: ${paymentError.message}`
      };
    }

    return {
      success: true,
      skipped: false,
      transaction,
      invoiceCode: currentInvoice.invoice_code,
      paymentId: payment.id,
      amount: paymentAmount,
      confidence,
      matchReasons
    };
  } catch (error) {
    return {
      success: false,
      skipped: false,
      transaction,
      invoiceCode: matchedInvoice?.invoice_code,
      error: error.message
    };
  }
}

function buildPaymentNotes(transaction, confidence, matchReasons) {
  const parts = [
    `[Import tự động - ${confidence.toUpperCase()}]`,
    `Ngày GD: ${transaction.date || 'N/A'}`,
    `Nội dung: ${truncateString(transaction.description, 100)}`,
    `Lý do match: ${matchReasons.join('; ')}`
  ];
  return parts.join(' | ');
}

function truncateString(str, maxLength) {
  if (!str) return '';
  return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
}
