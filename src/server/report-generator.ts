import ExcelJS from "exceljs";
import PDFDocument from 'pdfkit';
import { Resend } from 'resend';

async function createExcelWorkbook(month: string, transactions: any[], customers: any[]) {
  try {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Smart Ledger AI';

  wb.lastModifiedBy = 'Smart Ledger AI';
  wb.created = new Date();
  wb.modified = new Date();

  // Metrics calculations
  const receivedTxs = transactions.filter((t: any) => t.type === 'received');
  const pendingTxs = transactions.filter((t: any) => t.type === 'pending');
  
  const received = receivedTxs.reduce((sum: number, t: any) => sum + t.amount, 0);
  const pending = pendingTxs.reduce((sum: number, t: any) => sum + t.amount, 0);
  const totalTxs = transactions.length;
  
  const highestPayment = receivedTxs.sort((a: any, b: any) => b.amount - a.amount)[0]?.amount || 0;
  const avgPayment = receivedTxs.length ? received / receivedTxs.length : 0;
  
  const collectionRate = (received + pending) > 0 ? (received / (received + pending)) : 1;
  const recoveryRate = 0.85; // mock
  const avgPaymentTime = '4.2 Days'; // mock
  
  const customerStats = customers.map((c: any) => {
    const custTx = transactions.filter((t: any) => t.personName === c.name);
    const paid = custTx.filter((t: any) => t.type === 'received').reduce((sum: number, t: any) => sum + t.amount, 0);
    const pend = custTx.filter((t: any) => t.type === 'pending').reduce((sum: number, t: any) => sum + t.amount, 0);
    return { name: c.name, paid, pend, total: paid + pend, count: custTx.length };
  });

  const mostActiveCustomer = customerStats.sort((a: any, b: any) => b.count - a.count)[0]?.name || 'N/A';
  const topPayingCustomer = customerStats.sort((a: any, b: any) => b.paid - a.paid)[0]?.name || 'N/A';

  const latePayments = pendingTxs.filter((t: any) => t.status === 'overdue').length;
  const completedPayments = receivedTxs.length;
  const pendingCustomers = customerStats.filter((c: any) => c.pend > 0).length;
  const totalCustomers = customers.length;
  const monthlyGrowth = 0.125; // 12.5% mock

  const healthScoreNum = Math.min(100, Math.max(0, Math.round(collectionRate * 100)));
  let healthBadge = '';
  let healthColor = '';
  if (healthScoreNum >= 90) { healthBadge = `🟢 Excellent (${healthScoreNum}/100)`; healthColor = 'FF00B050'; }
  else if (healthScoreNum >= 70) { healthBadge = `🟡 Good (${healthScoreNum}/100)`; healthColor = 'FFFFC000'; }
  else if (healthScoreNum >= 50) { healthBadge = `🟠 Average (${healthScoreNum}/100)`; healthColor = 'FFFF9900'; }
  else { healthBadge = `🔴 Needs Attention (${healthScoreNum}/100)`; healthColor = 'FFFF0000'; }

  const ws = wb.addWorksheet('Dashboard', {
    views: [{ state: 'frozen', ySplit: 11 }]
  });

  // Default font and columns
  ws.columns = [
    { key: 'A', width: 35 },
    { key: 'B', width: 25 },
    { key: 'C', width: 25 },
    { key: 'D', width: 25 },
  ];

  // Professional Header
  ws.mergeCells('A1:D2');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'SMART LEDGER\nMonthly Financial Report';
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

  ws.mergeCells('A3:D3');
  const subTitleCell = ws.getCell('A3');
  subTitleCell.value = `Month: ${month}  |  Generated On: ${new Date().toLocaleString()}`;
  subTitleCell.font = { name: 'Calibri', size: 11, italic: true, color: { argb: 'FFFFFFFF' } };
  subTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
  subTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  ws.addRow([]);

  ws.getCell('A5').value = 'Total Received';
  ws.getCell('B5').value = 'Total Pending';
  ws.getCell('C5').value = 'Transactions';
  ws.getCell('D5').value = 'Business Score';
  
  const cardTitleFont = { name: 'Calibri', size: 11, color: { argb: 'FF64748B' }, bold: true };
  const cardTitleFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  
  ['A5', 'B5', 'C5', 'D5'].forEach(ref => {
    const cell = ws.getCell(ref);
    cell.font = cardTitleFont;
    cell.fill = cardTitleFill as any;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = { top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, left: { style: 'thin', color: { argb: 'FFCBD5E1' } }, right: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
  });

  ws.getCell('A6').value = received;
  ws.getCell('A6').numFmt = '[$₹-en-IN]#,##0.00';
  ws.getCell('A6').font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF10B981' } };

  ws.getCell('B6').value = pending;
  ws.getCell('B6').numFmt = '[$₹-en-IN]#,##0.00';
  ws.getCell('B6').font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFF59E0B' } };

  ws.getCell('C6').value = totalTxs;
  ws.getCell('C6').numFmt = '#,##0';
  ws.getCell('C6').font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF3B82F6' } };

  ws.getCell('D6').value = healthScoreNum / 100;
  ws.getCell('D6').numFmt = '0%';
  ws.getCell('D6').font = { name: 'Calibri', size: 16, bold: true, color: { argb: healthColor.replace('FF', '') } };

  ['A6', 'B6', 'C6', 'D6'].forEach(ref => {
    const cell = ws.getCell(ref);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } }, left: { style: 'thin', color: { argb: 'FFCBD5E1' } }, right: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
  });

  ws.addRow([]);
  ws.addRow([]);

  const tableHeaders = ['Metric', 'Value'];
  const startRow = 10;
  const headerRow = ws.getRow(startRow);
  headerRow.values = tableHeaders;
  
  headerRow.eachCell(cell => {
    cell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
    cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    cell.border = { bottom: { style: 'medium', color: { argb: 'FF0F172A' } } };
  });

  const metrics: any[] = [
    ['Total Money Received', received, 'currency'],
    ['Total Pending Amount', pending, 'currency'],
    ['Total Transactions', totalTxs, 'number'],
    ['Highest Payment', highestPayment, 'currency'],
    ['Average Payment', avgPayment, 'currency'],
    ['Business Health Score', healthBadge, 'text'],
    ['Collection Rate', collectionRate, 'percent'],
    ['Recovery Rate', recoveryRate, 'percent'],
    ['Average Payment Time', avgPaymentTime, 'text'],
    ['Most Active Customer', mostActiveCustomer, 'text'],
    ['Top Paying Customer', topPayingCustomer, 'text'],
    ['Late Payments', latePayments, 'number'],
    ['Completed Payments', completedPayments, 'number'],
    ['Pending Customers', pendingCustomers, 'number'],
    ['Total Customers', totalCustomers, 'number'],
    ['Monthly Growth %', monthlyGrowth, 'percent']
  ];

  metrics.forEach((m, i) => {
    const row = ws.getRow(startRow + 1 + i);
    row.values = [m[0], m[1]];
    
    const isEven = i % 2 === 0;
    const bgColor = isEven ? 'FFF1F5F9' : 'FFFFFFFF';
    
    row.eachCell((cell, colNumber) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      cell.font = { name: 'Calibri', size: 12, color: { argb: 'FF334155' }, bold: colNumber === 1 };
      cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 ? 'left' : 'right', indent: 1 };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }, left: { style: 'thin', color: { argb: 'FFE2E8F0' } }, right: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
    });

    const valueCell = row.getCell(2);
    if (m[2] === 'currency') valueCell.numFmt = '[$₹-en-IN]#,##0.00';
    else if (m[2] === 'percent') valueCell.numFmt = '0%';
    else if (m[2] === 'number') valueCell.numFmt = '#,##0';
    else if (m[2] === 'text' && String(m[1]).includes('Excellent')) valueCell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF00B050' } };
    else if (m[2] === 'text' && String(m[1]).includes('Needs Attention')) valueCell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFF0000' } };
  });
  
  const footerRow = ws.getRow(startRow + metrics.length + 2);
  ws.mergeCells(`A${footerRow.number}:B${footerRow.number}`);
  const footerCell = ws.getCell(`A${footerRow.number}`);
  footerCell.value = `Generated by Smart Ledger AI on ${new Date().toLocaleString()}`;
  footerCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF94A3B8' } };
  footerCell.alignment = { horizontal: 'center' };

  // Transactions Sheet
  const wsTx = wb.addWorksheet('Transactions', { views: [{ state: 'frozen', ySplit: 1 }] });
  wsTx.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Customer Name', key: 'name', width: 25 },
    { header: 'Amount', key: 'amount', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Payment Method', key: 'method', width: 20 },
    { header: 'Notes', key: 'notes', width: 30 }
  ];

  wsTx.getRow(1).eachCell(cell => {
    cell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  transactions.forEach((t: any) => {
    const row = wsTx.addRow({
      date: t.date || t.dueDate,
      name: t.personName,
      amount: t.amount,
      status: t.type === 'pending' ? (t.status === 'overdue' ? 'Overdue' : 'Pending') : 'Received',
      method: t.paymentMethod || '-',
      notes: t.purpose || t.reason || '-'
    });
    
    row.getCell('amount').numFmt = '[$₹-en-IN]#,##0.00';
    
    const statusCell = row.getCell('status');
    if (statusCell.value === 'Overdue') {
      statusCell.font = { color: { argb: 'FFDC2626' }, bold: true };
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } } as any;
    } else if (statusCell.value === 'Pending') {
      statusCell.font = { color: { argb: 'FFD97706' }, bold: true };
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } } as any;
    } else {
      statusCell.font = { color: { argb: 'FF059669' }, bold: true };
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } } as any;
    }
  });

  // Pending Heatmap Sheet
  if (pendingTxs.length > 0) {
    const wsPending = wb.addWorksheet('Pending Heatmap', { views: [{ state: 'frozen', ySplit: 1 }] });
    wsPending.columns = [
      { header: 'Customer', key: 'name', width: 25 },
      { header: 'Amount Due', key: 'amount', width: 20 },
      { header: 'Due Date', key: 'date', width: 15 },
      { header: 'Days Overdue', key: 'overdue', width: 15 }
    ];

    wsPending.getRow(1).eachCell(cell => {
      cell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
    });


    pendingTxs.sort((a: any, b: any) => b.amount - a.amount).forEach((t: any) => {
      const daysOverdue = t.status === 'overdue' ? Math.floor((new Date().getTime() - new Date(t.dueDate).getTime()) / (1000 * 3600 * 24)) : 0;
      const row = wsPending.addRow({
        name: t.personName,
        amount: t.amount,
        date: t.dueDate,
        overdue: daysOverdue
      });
      const amountCell = row.getCell('amount');
      amountCell.numFmt = '[$₹-en-IN]#,##0.00';
      
      // Conditional Formatting logic
      if (t.amount > 10000) {
        amountCell.font = { color: { argb: 'FFDC2626' }, bold: true }; // Red
      } else if (t.amount > 2000) {
        amountCell.font = { color: { argb: 'FFEA580C' }, bold: true }; // Orange
      } else {
        amountCell.font = { color: { argb: 'FF16A34A' }, bold: true }; // Green
      }
    });



  }

  // Customers Sheet
  const wsCust = wb.addWorksheet('Customers', { views: [{ state: 'frozen', ySplit: 1 }] });
  wsCust.columns = [
    { header: 'Customer Name', key: 'name', width: 25 },
    { header: 'Total Paid', key: 'paid', width: 20 },
    { header: 'Total Pending', key: 'pend', width: 20 },
    { header: 'Total Tx Count', key: 'count', width: 15 }
  ];

  wsCust.getRow(1).eachCell(cell => {
    cell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
  });

  customerStats.sort((a: any, b: any) => b.total - a.total).forEach((c: any) => {
    const row = wsCust.addRow(c);
    row.getCell('paid').numFmt = '[$₹-en-IN]#,##0.00';
    row.getCell('pend').numFmt = '[$₹-en-IN]#,##0.00';
  });


  // Auto-fit columns
  wb.worksheets.forEach(worksheet => {
    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell!({ includeEmpty: true }, cell => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = maxLength < 10 ? 10 : maxLength > 50 ? 50 : maxLength + 2;
    });
  });

  return await wb.xlsx.writeBuffer() as Buffer;

  } catch (error) {
    console.error("Failed to create Excel workbook:", error);
    throw error;
  }
}

export async function generateAndSendReport(
  email: string,
  month: string,
  transactions: any[],
  customers: any[],
  includePdf: boolean,
  aiSummary: string,
  resendApiKey: string
) {
  const resend = new Resend(resendApiKey);

  const excelBuffer = await createExcelWorkbook(month, transactions, customers);

  let pdfBuffer: Buffer | null = null;
  if (includePdf) {
    pdfBuffer = await new Promise((resolve) => {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: any) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.fontSize(20).text('SmartLedger Monthly Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text(`Month: ${month}`);
      doc.moveDown();
      const received = transactions.filter((t: any) => t.type === 'received').reduce((sum: number, t: any) => sum + t.amount, 0);
      const pending = transactions.filter((t: any) => t.type === 'pending').reduce((sum: number, t: any) => sum + t.amount, 0);
      doc.fontSize(12).text(`Total Received: Rs. ${received}`);
      doc.text(`Total Pending: Rs. ${pending}`);
      doc.moveDown();
      doc.text('AI Summary:');
      doc.text(aiSummary);
      doc.end();
    });
  }

  const attachments = [
    {
      filename: `SmartLedger_Report_${month.replace(' ', '_')}.xlsx`,
      content: excelBuffer,
    }
  ];

  if (pdfBuffer) {
    attachments.push({
      filename: `SmartLedger_Report_${month.replace(' ', '_')}.pdf`,
      content: pdfBuffer,
    });
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
      <div style="padding: 32px 24px;">
        <p style="color: #475569; font-size: 16px; margin: 0 0 16px;">Hello,</p>
        <p style="color: #475569; font-size: 16px; margin: 0 0 16px;">Your SmartLedger Monthly Business Report has been generated successfully.</p>
        <p style="color: #475569; font-size: 16px; margin: 0 0 16px;">Included:</p>
        <ul style="color: #475569; font-size: 16px; margin: 0 0 16px;">
          <li>Excel Report</li>
          ${includePdf ? '<li>PDF Summary</li>' : ''}
          <li>AI Business Summary</li>
        </ul>
        <p style="color: #475569; font-size: 16px; margin: 0 0 16px;"><strong>AI Business Summary:</strong><br/>${aiSummary.replace(/\n/g, '<br/>')}</p>
        <p style="color: #475569; font-size: 16px; margin: 0 0 16px;">Thank you for using SmartLedger.</p>
      </div>
    </div>
  `;

  const data = await resend.emails.send({
    from: 'SmartLedger <onboarding@resend.dev>',
    to: email,
    subject: `📊 SmartLedger Monthly Business Report – ${month}`,
    html: htmlContent,
    attachments
  });

  return {
    success: !data.error,
    error: data.error,
    fileSizeXlsx: excelBuffer.length,
    fileSizePdf: pdfBuffer ? pdfBuffer.length : 0
  };
}

export async function buildReportFiles(
  month: string,
  transactions: any[],
  customers: any[],
  aiSummary: string
) {
  const excelBuffer = await createExcelWorkbook(month, transactions, customers);

  const pdfBuffer = await new Promise<Buffer>((resolve) => {
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: any) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    doc.fontSize(20).text('SmartLedger Monthly Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Month: ${month}`);
    doc.moveDown();
    const received = transactions.filter((t: any) => t.type === 'received').reduce((sum: number, t: any) => sum + t.amount, 0);
    const pending = transactions.filter((t: any) => t.type === 'pending').reduce((sum: number, t: any) => sum + t.amount, 0);
    doc.fontSize(12).text(`Total Received: Rs. ${received}`);
    doc.text(`Total Pending: Rs. ${pending}`);
    doc.moveDown();
    doc.text('AI Summary:');
    doc.text(aiSummary);
    doc.end();
  });

  return {
    excelBase64: excelBuffer.toString('base64'),
    pdfBase64: pdfBuffer.toString('base64'),
    fileSizeXlsx: excelBuffer.length,
    fileSizePdf: pdfBuffer.length
  };
}
