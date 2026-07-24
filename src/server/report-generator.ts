import * as xlsx from 'xlsx';
import PDFDocument from 'pdfkit';
import { Resend } from 'resend';
import { GoogleGenAI } from '@google/genai';

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

  // 1. Generate Excel
  const wb = xlsx.utils.book_new();

  // Sheet 1: Monthly Summary
  const received = transactions.filter(t => t.type === 'received').reduce((sum, t) => sum + t.amount, 0);
  const pending = transactions.filter(t => t.type === 'pending').reduce((sum, t) => sum + t.amount, 0);
  const highestPayment = transactions.filter(t => t.type === 'received').sort((a, b) => b.amount - a.amount)[0]?.amount || 0;
  const avgPayment = transactions.filter(t => t.type === 'received').length ? received / transactions.filter(t => t.type === 'received').length : 0;
  
  const wsSummary = xlsx.utils.aoa_to_sheet([
    ['Metric', 'Value'],
    ['Total Money Received', received],
    ['Total Pending', pending],
    ['Total Transactions', transactions.length],
    ['Highest Payment', highestPayment],
    ['Average Payment', avgPayment],
    ['Business Health Score', '95/100'],
  ]);
  xlsx.utils.book_append_sheet(wb, wsSummary, 'Monthly Summary');

  // Sheet 2: All Transactions
  const wsTransactions = xlsx.utils.json_to_sheet(
    transactions.map(t => ({
      Date: t.date || t.dueDate,
      'Customer Name': t.personName,
      'Phone Number': t.phoneNumber || '',
      Amount: t.amount,
      Status: t.type,
      'Payment Method': t.paymentMethod || '',
      Notes: t.purpose || t.reason || ''
    }))
  );
  xlsx.utils.book_append_sheet(wb, wsTransactions, 'All Transactions');

  // Sheet 3: Pending Payments
  const pendingTransactions = transactions.filter(t => t.type === 'pending');
  const wsPending = xlsx.utils.json_to_sheet(
    pendingTransactions.map(t => ({
      'Customer Name': t.personName,
      Phone: t.phoneNumber || '',
      'Pending Amount': t.amount,
      'Due Date': t.dueDate,
      'Days Overdue': t.status === 'overdue' ? Math.floor((new Date().getTime() - new Date(t.dueDate).getTime()) / (1000 * 3600 * 24)) : 0,
      Priority: t.status === 'overdue' ? 'High' : 'Normal'
    }))
  );
  xlsx.utils.book_append_sheet(wb, wsPending, 'Pending Payments');

  // Sheet 4: Customer Statistics
  const customerStats = customers.map(c => {
    const custTx = transactions.filter(t => t.personName === c.name);
    const totalPaid = custTx.filter(t => t.type === 'received').reduce((sum, t) => sum + t.amount, 0);
    const pendingAmount = custTx.filter(t => t.type === 'pending').reduce((sum, t) => sum + t.amount, 0);
    return {
      'Customer Name': c.name,
      Transactions: custTx.length,
      'Total Paid': totalPaid,
      Pending: pendingAmount,
      'Trust Score': pendingAmount > 0 ? (totalPaid > 0 ? 80 : 50) : 100,
      'Lifetime Value': totalPaid
    };
  });
  const wsCustomers = xlsx.utils.json_to_sheet(customerStats);
  xlsx.utils.book_append_sheet(wb, wsCustomers, 'Customer Statistics');

  // Sheet 5: Analytics
  const wsAnalytics = xlsx.utils.aoa_to_sheet([
    ['Analytics Overview', ''],
    ['Top Customer', customerStats.sort((a, b) => b['Total Paid'] - a['Total Paid'])[0]?.['Customer Name'] || 'N/A'],
    ['Total Lifetime Value', customerStats.reduce((sum, c) => sum + c['Total Paid'], 0)],
  ]);
  xlsx.utils.book_append_sheet(wb, wsAnalytics, 'Analytics');

  // Generate Excel Buffer
  const excelBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

  let pdfBuffer: Buffer | null = null;
  if (includePdf) {
    pdfBuffer = await new Promise((resolve) => {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.fontSize(20).text('SmartLedger Monthly Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text(`Month: ${month}`);
      doc.moveDown();
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
  // 1. Generate Excel
  const wb = xlsx.utils.book_new();

  // Sheet 1: Monthly Summary
  const received = transactions.filter(t => t.type === 'received').reduce((sum, t) => sum + t.amount, 0);
  const pending = transactions.filter(t => t.type === 'pending').reduce((sum, t) => sum + t.amount, 0);
  const highestPayment = transactions.filter(t => t.type === 'received').sort((a, b) => b.amount - a.amount)[0]?.amount || 0;
  const avgPayment = transactions.filter(t => t.type === 'received').length ? received / transactions.filter(t => t.type === 'received').length : 0;
  
  const wsSummary = xlsx.utils.aoa_to_sheet([
    ['Metric', 'Value'],
    ['Total Money Received', received],
    ['Total Pending', pending],
    ['Total Transactions', transactions.length],
    ['Highest Payment', highestPayment],
    ['Average Payment', avgPayment],
    ['Business Health Score', '95/100'],
  ]);
  xlsx.utils.book_append_sheet(wb, wsSummary, 'Monthly Summary');

  // Sheet 2: All Transactions
  const wsTransactions = xlsx.utils.json_to_sheet(
    transactions.map(t => ({
      Date: t.date || t.dueDate,
      'Customer Name': t.personName,
      'Phone Number': t.phoneNumber || '',
      Amount: t.amount,
      Status: t.type,
      'Payment Method': t.paymentMethod || '',
      Notes: t.purpose || t.reason || ''
    }))
  );
  xlsx.utils.book_append_sheet(wb, wsTransactions, 'All Transactions');

  // Sheet 3: Pending Payments
  const pendingTransactions = transactions.filter(t => t.type === 'pending');
  const wsPending = xlsx.utils.json_to_sheet(
    pendingTransactions.map(t => ({
      'Customer Name': t.personName,
      Phone: t.phoneNumber || '',
      'Pending Amount': t.amount,
      'Due Date': t.dueDate,
      'Days Overdue': t.status === 'overdue' ? Math.floor((new Date().getTime() - new Date(t.dueDate).getTime()) / (1000 * 3600 * 24)) : 0,
      Priority: t.status === 'overdue' ? 'High' : 'Normal'
    }))
  );
  xlsx.utils.book_append_sheet(wb, wsPending, 'Pending Payments');

  // Sheet 4: Customer Statistics
  const customerStats = customers.map(c => {
    const custTx = transactions.filter(t => t.personName === c.name);
    const totalPaid = custTx.filter(t => t.type === 'received').reduce((sum, t) => sum + t.amount, 0);
    const pendingAmount = custTx.filter(t => t.type === 'pending').reduce((sum, t) => sum + t.amount, 0);
    return {
      'Customer Name': c.name,
      Transactions: custTx.length,
      'Total Paid': totalPaid,
      Pending: pendingAmount,
      'Trust Score': pendingAmount > 0 ? (totalPaid > 0 ? 80 : 50) : 100,
      'Lifetime Value': totalPaid
    };
  });
  const wsCustomers = xlsx.utils.json_to_sheet(customerStats);
  xlsx.utils.book_append_sheet(wb, wsCustomers, 'Customer Statistics');

  // Sheet 5: Analytics
  const wsAnalytics = xlsx.utils.aoa_to_sheet([
    ['Analytics Overview', ''],
    ['Top Customer', customerStats.sort((a, b) => b['Total Paid'] - a['Total Paid'])[0]?.['Customer Name'] || 'N/A'],
    ['Total Lifetime Value', customerStats.reduce((sum, c) => sum + c['Total Paid'], 0)],
  ]);
  xlsx.utils.book_append_sheet(wb, wsAnalytics, 'Analytics');

  // Generate Excel Buffer
  const excelBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

  const pdfBuffer = await new Promise<Buffer>((resolve) => {
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    doc.fontSize(20).text('SmartLedger Monthly Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Month: ${month}`);
    doc.moveDown();
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
