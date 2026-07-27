import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, parseISO, isSameDay, isSameWeek, isSameMonth, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';

export type ExportFormat = 'excel' | 'pdf';
export type ExportFilterType = 'all' | 'today' | 'week' | 'month' | 'custom' | 'selected';

export interface ExportOptions {
  format: ExportFormat;
  filterType: ExportFilterType;
  startDate?: string;
  endDate?: string;
  selectedIds?: string[];
  records: any[];
  title?: string;
  reportType: 'entries' | 'pending';
}

// Helper to clean & parse date strings reliably
function parseRecordDate(dateStr: any): Date | null {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  try {
    const parsedISO = parseISO(dateStr);
    if (!isNaN(parsedISO.getTime())) return parsedISO;

    const nativeDate = new Date(dateStr);
    if (!isNaN(nativeDate.getTime())) return nativeDate;

    // Handle "YYYY-MM-DD HH:mm AM/PM" or "YYYY-MM-DD"
    const firstPart = String(dateStr).split(' ')[0];
    const fallbackDate = new Date(firstPart);
    if (!isNaN(fallbackDate.getTime())) return fallbackDate;
  } catch (e) {
    // Ignore
  }
  return null;
}

// Filter records based on selected filter option
export function filterRecordsForExport(records: any[], options: Partial<ExportOptions>): any[] {
  if (!records || records.length === 0) return [];
  const { filterType = 'all', startDate, endDate, selectedIds } = options;

  const now = new Date();

  return records.filter(item => {
    // Check selected IDs first if filter is 'selected'
    if (filterType === 'selected') {
      if (!selectedIds || selectedIds.length === 0) return true;
      return selectedIds.includes(item.id);
    }

    if (filterType === 'all') return true;

    const recordDate = parseRecordDate(item.date || item.dueDate || item.createdAt);
    if (!recordDate) return true; // If date missing, default include

    if (filterType === 'today') {
      return isSameDay(recordDate, now);
    }

    if (filterType === 'week') {
      return isSameWeek(recordDate, now, { weekStartsOn: 1 });
    }

    if (filterType === 'month') {
      return isSameMonth(recordDate, now);
    }

    if (filterType === 'custom') {
      if (startDate) {
        const start = startOfDay(parseISO(startDate));
        if (isBefore(recordDate, start)) return false;
      }
      if (endDate) {
        const end = endOfDay(parseISO(endDate));
        if (isAfter(recordDate, end)) return false;
      }
      return true;
    }

    return true;
  });
}

/**
 * EXPORT ENTRIES REPORT (EXCEL & PDF)
 */
export async function generateEntriesReport(options: ExportOptions): Promise<void> {
  const filteredData = filterRecordsForExport(options.records, options);
  const nowStr = format(new Date(), 'yyyy-MM-dd_HHmm');
  const dateStrPretty = format(new Date(), 'dd MMM yyyy, hh:mm a');

  // Compute metrics
  const totalEntries = filteredData.length;
  let totalReceived = 0;
  let totalPending = 0;

  filteredData.forEach(item => {
    const amt = Number(item.amount) || 0;
    if (item.type === 'received' || item.type === 'income' || item.status === 'completed' || item.status === 'paid' || item.status === 'received') {
      totalReceived += amt;
    } else {
      totalPending += amt;
    }
  });

  if (options.format === 'excel') {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'SmartLedger';
    wb.created = new Date();

    const ws = wb.addWorksheet('Entries Report');

    // Title Block
    ws.mergeCells('A1:L1');
    const titleCell = ws.getCell('A1');
    titleCell.value = 'SmartLedger Entries Report';
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } }; // emerald-600
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    ws.getRow(1).height = 40;

    // Meta Block
    ws.addRow([]);
    ws.addRow(['Export Date & Time:', dateStrPretty, '', 'Total Entries:', totalEntries]);
    ws.addRow(['Total Received Amount:', totalReceived, '', 'Total Pending Amount:', totalPending]);
    ws.getRow(3).font = { bold: true };
    ws.getRow(4).font = { bold: true };
    ws.getCell('B4').numFmt = '[$₹-en-IN]#,##0.00';
    ws.getCell('E4').numFmt = '[$₹-en-IN]#,##0.00';
    ws.addRow([]);

    // Table Header Row
    const headerRow = ws.addRow([
      'S.No',
      'Customer / Name',
      'Phone Number',
      'Amount (₹)',
      'Status',
      'Category',
      'Payment Method',
      'Transaction Date',
      'Due Date',
      'Notes / Purpose',
      'Created Date',
      'Updated Date'
    ]);

    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111827' } }; // dark neutral-900
    headerRow.height = 25;
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Freeze header pane
    ws.views = [{ state: 'frozen', ySplit: 6 }];

    // Populate Data
    filteredData.forEach((item, idx) => {
      const row = ws.addRow([
        idx + 1,
        item.personName || item.customerName || 'N/A',
        item.phoneNumber || item.phone || 'N/A',
        Number(item.amount) || 0,
        (item.status || item.type || 'Completed').toUpperCase(),
        item.category || item.purpose || 'General',
        item.method || item.paymentMethod || 'UPI',
        item.date || 'N/A',
        item.dueDate || 'N/A',
        item.note || item.notes || item.reason || 'N/A',
        item.createdAt ? format(parseRecordDate(item.createdAt) || new Date(), 'yyyy-MM-dd') : (item.date || 'N/A'),
        item.updatedAt ? format(parseRecordDate(item.updatedAt) || new Date(), 'yyyy-MM-dd') : (item.date || 'N/A')
      ]);

      // Format Amount cell
      const amtCell = row.getCell(4);
      amtCell.numFmt = '[$₹-en-IN]#,##0.00';
      amtCell.alignment = { horizontal: 'right' };

      // Alternating row styling
      if (idx % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
      }
    });

    // Summary Total Row
    const totalRow = ws.addRow(['', 'TOTAL', '', totalReceived, '', '', '', '', '', '', '', '']);
    totalRow.font = { bold: true, size: 11 };
    totalRow.getCell(4).numFmt = '[$₹-en-IN]#,##0.00';
    totalRow.getCell(4).alignment = { horizontal: 'right' };
    totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };

    // Auto-fit column widths
    ws.columns.forEach((col, i) => {
      let maxLen = 12;
      ws.getColumn(i + 1).eachCell({ includeEmpty: true }, (cell) => {
        const valStr = cell.value ? String(cell.value) : '';
        if (valStr.length > maxLen) maxLen = valStr.length;
      });
      col.width = Math.min(Math.max(maxLen + 3, 12), 40);
    });

    const buffer = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `SmartLedger_Entries_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);

  } else {
    // --- PDF EXPORT ---
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // Brand Header Box
    doc.setFillColor(5, 150, 105); // emerald-600
    doc.rect(0, 0, doc.internal.pageSize.width, 22, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text('SmartLedger Entries Report', 14, 14);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${dateStrPretty}`, doc.internal.pageSize.width - 14, 14, { align: 'right' });

    // Summary Cards Section
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(14, 26, 80, 16, 2, 2, 'F');
    doc.roundedRect(102, 26, 80, 16, 2, 2, 'F');
    doc.roundedRect(190, 26, 92, 16, 2, 2, 'F');

    doc.setTextColor(55, 65, 81);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL ENTRIES', 18, 32);
    doc.text('TOTAL RECEIVED', 106, 32);
    doc.text('TOTAL PENDING', 194, 32);

    doc.setFontSize(12);
    doc.setTextColor(16, 185, 129); // emerald-600
    doc.text(`${totalEntries} Records`, 18, 38);
    doc.text(`Rs ${totalReceived.toLocaleString('en-IN')}`, 106, 38);

    doc.setTextColor(217, 119, 6); // amber-600
    doc.text(`Rs ${totalPending.toLocaleString('en-IN')}`, 194, 38);

    // Table
    const tableHead = [["#", "Customer Name", "Phone", "Amount (Rs)", "Status", "Category", "Method", "Date", "Notes"]];
    const tableBody = filteredData.map((item, idx) => [
      idx + 1,
      item.personName || item.customerName || 'N/A',
      item.phoneNumber || item.phone || 'N/A',
      `Rs ${(Number(item.amount) || 0).toLocaleString('en-IN')}`,
      (item.status || item.type || 'Completed').toUpperCase(),
      item.category || item.purpose || 'General',
      item.method || item.paymentMethod || 'UPI',
      item.date || 'N/A',
      item.note || item.notes || item.reason || '-'
    ]);

    autoTable(doc, {
      head: tableHead,
      body: tableBody,
      startY: 47,
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 2.5, overflow: 'linebreak' },
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 38, fontStyle: 'bold' },
        2: { cellWidth: 28 },
        3: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 25 },
        6: { cellWidth: 25 },
        7: { cellWidth: 28 },
        8: { cellWidth: 'auto' },
      },
      didDrawPage: function (data) {
        // Footer Page Numbering
        const totalPages = (doc as any).internal.getNumberOfPages();
        const currentPage = data.pageNumber;
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text(
          `Page ${currentPage} of ${totalPages}`,
          doc.internal.pageSize.width - 14,
          doc.internal.pageSize.height - 8,
          { align: 'right' }
        );
        doc.text(
          `SmartLedger Official Report • Confidential`,
          14,
          doc.internal.pageSize.height - 8
        );
      }
    });

    doc.save(`SmartLedger_Entries_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  }
}

/**
 * EXPORT PENDING PAYMENTS REPORT (EXCEL & PDF)
 */
export async function generatePendingReport(options: ExportOptions): Promise<void> {
  const filteredData = filterRecordsForExport(options.records, options);
  const nowStr = format(new Date(), 'yyyy-MM-dd_HHmm');
  const dateStrPretty = format(new Date(), 'dd MMM yyyy, hh:mm a');

  const totalPendingEntries = filteredData.length;
  let totalPendingAmount = 0;
  let overdueCount = 0;

  const todayStr = new Date().toISOString().split('T')[0];

  filteredData.forEach(item => {
    const amt = Number(item.amount) || 0;
    totalPendingAmount += amt;
    if (item.status === 'overdue' || (item.dueDate && item.dueDate < todayStr && item.status !== 'paid' && item.status !== 'received')) {
      overdueCount++;
    }
  });

  if (options.format === 'excel') {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'SmartLedger';
    wb.created = new Date();

    const ws = wb.addWorksheet('Pending Payments');

    // Title Block
    ws.mergeCells('A1:H1');
    const titleCell = ws.getCell('A1');
    titleCell.value = 'SmartLedger Pending Payments Report';
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD97706' } }; // amber-600
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    ws.getRow(1).height = 40;

    // Meta Block
    ws.addRow([]);
    ws.addRow(['Export Date & Time:', dateStrPretty, '', 'Total Pending Records:', totalPendingEntries]);
    ws.addRow(['Total Pending Amount:', totalPendingAmount, '', 'Overdue Count:', overdueCount]);
    ws.getRow(3).font = { bold: true };
    ws.getRow(4).font = { bold: true };
    ws.getCell('B4').numFmt = '[$₹-en-IN]#,##0.00';
    ws.addRow([]);

    // Table Header Row
    const headerRow = ws.addRow([
      'S.No',
      'Customer Name',
      'Phone Number',
      'Pending Amount (₹)',
      'Due Date',
      'Reminder Date',
      'Days Remaining / Status',
      'Notes / Reason'
    ]);

    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111827' } };
    headerRow.height = 25;
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    ws.views = [{ state: 'frozen', ySplit: 6 }];

    // Populate Data
    filteredData.forEach((item, idx) => {
      let daysRemainingStr = 'Pending';
      if (item.dueDate) {
        const dDate = parseRecordDate(item.dueDate);
        if (dDate) {
          const diffDays = Math.ceil((dDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
          if (diffDays < 0) {
            daysRemainingStr = `Overdue by ${Math.abs(diffDays)} days`;
          } else if (diffDays === 0) {
            daysRemainingStr = 'Due Today';
          } else {
            daysRemainingStr = `${diffDays} days remaining`;
          }
        }
      }

      const row = ws.addRow([
        idx + 1,
        item.personName || item.customerName || 'N/A',
        item.phoneNumber || item.phone || 'N/A',
        Number(item.amount) || 0,
        item.dueDate || item.date || 'N/A',
        item.reminderDate || 'N/A',
        daysRemainingStr,
        item.notes || item.reason || item.note || 'N/A'
      ]);

      const amtCell = row.getCell(4);
      amtCell.numFmt = '[$₹-en-IN]#,##0.00';
      amtCell.alignment = { horizontal: 'right' };

      if (idx % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
      }
    });

    // Summary Total Row
    const totalRow = ws.addRow(['', 'TOTAL PENDING', '', totalPendingAmount, '', '', '', '']);
    totalRow.font = { bold: true, size: 11 };
    totalRow.getCell(4).numFmt = '[$₹-en-IN]#,##0.00';
    totalRow.getCell(4).alignment = { horizontal: 'right' };
    totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };

    // Auto column widths
    ws.columns.forEach((col, i) => {
      let maxLen = 12;
      ws.getColumn(i + 1).eachCell({ includeEmpty: true }, (cell) => {
        const valStr = cell.value ? String(cell.value) : '';
        if (valStr.length > maxLen) maxLen = valStr.length;
      });
      col.width = Math.min(Math.max(maxLen + 3, 12), 40);
    });

    const buffer = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `SmartLedger_Pending_Report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);

  } else {
    // --- PDF EXPORT ---
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Brand Header Box
    doc.setFillColor(217, 119, 6); // amber-600
    doc.rect(0, 0, doc.internal.pageSize.width, 22, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('SmartLedger Pending Payments Report', 14, 14);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${dateStrPretty}`, doc.internal.pageSize.width - 14, 14, { align: 'right' });

    // Stats Cards
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(14, 26, 56, 16, 2, 2, 'F');
    doc.roundedRect(74, 26, 62, 16, 2, 2, 'F');
    doc.roundedRect(140, 26, 56, 16, 2, 2, 'F');

    doc.setTextColor(55, 65, 81);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL PENDING', 18, 32);
    doc.text('TOTAL AMOUNT DUE', 78, 32);
    doc.text('OVERDUE COUNT', 144, 32);

    doc.setFontSize(11);
    doc.setTextColor(217, 119, 6);
    doc.text(`${totalPendingEntries} Customers`, 18, 38);
    doc.text(`Rs ${totalPendingAmount.toLocaleString('en-IN')}`, 78, 38);

    doc.setTextColor(220, 38, 38); // red-600
    doc.text(`${overdueCount} Records`, 144, 38);

    // Table
    const tableHead = [["#", "Customer Name", "Phone", "Pending Amount", "Due Date", "Status", "Notes"]];
    const tableBody = filteredData.map((item, idx) => {
      let daysRemainingStr = (item.status || 'Pending').toUpperCase();
      if (item.dueDate) {
        const dDate = parseRecordDate(item.dueDate);
        if (dDate) {
          const diffDays = Math.ceil((dDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
          if (diffDays < 0) {
            daysRemainingStr = `OVERDUE (${Math.abs(diffDays)}d)`;
          } else if (diffDays === 0) {
            daysRemainingStr = 'DUE TODAY';
          } else {
            daysRemainingStr = `${diffDays}d REMAINING`;
          }
        }
      }

      return [
        idx + 1,
        item.personName || item.customerName || 'N/A',
        item.phoneNumber || item.phone || 'N/A',
        `Rs ${(Number(item.amount) || 0).toLocaleString('en-IN')}`,
        item.dueDate || item.date || 'N/A',
        daysRemainingStr,
        item.notes || item.reason || item.note || '-'
      ];
    });

    autoTable(doc, {
      head: tableHead,
      body: tableBody,
      startY: 47,
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 2.5, overflow: 'linebreak' },
      headStyles: { fillColor: [217, 119, 6], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 40, fontStyle: 'bold' },
        2: { cellWidth: 28 },
        3: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
        4: { cellWidth: 25 },
        5: { cellWidth: 28, halign: 'center' },
        6: { cellWidth: 'auto' },
      },
      didDrawPage: function (data) {
        const totalPages = (doc as any).internal.getNumberOfPages();
        const currentPage = data.pageNumber;
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text(
          `Page ${currentPage} of ${totalPages}`,
          doc.internal.pageSize.width - 14,
          doc.internal.pageSize.height - 8,
          { align: 'right' }
        );
        doc.text(
          `SmartLedger Pending Payments Report • Confidential`,
          14,
          doc.internal.pageSize.height - 8
        );
      }
    });

    doc.save(`SmartLedger_Pending_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  }
}
