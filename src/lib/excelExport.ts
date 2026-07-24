import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { format, differenceInDays, parseISO } from 'date-fns';
import { Transaction, ReceivedMoney, SentMoney, PendingMoney, GullakEntry, UnlockedAchievement } from '../types';
import { ACHIEVEMENTS, calculateProgress, getCurrentLevel } from './achievements';

export const exportGullakExcel = async (
  entries: GullakEntry[], 
  unlockedAchievements: UnlockedAchievement[], 
  settings: any
) => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Gullak Savings');

  ws.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Person Name', key: 'personName', width: 25 },
    { header: 'Amount (₹)', key: 'amount', width: 15 },
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Time', key: 'time', width: 15 },
    { header: 'Payment Method', key: 'paymentMethod', width: 15 },
    { header: 'Category', key: 'category', width: 15 },
    { header: 'Notes', key: 'note', width: 30 }
  ];

  // Header style
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFDB2777' }, // pink-600
  };
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: ws.columns.length },
  };

  let total = 0;
  entries.forEach((entry, idx) => {
    const row = ws.addRow(entry);
    row.getCell('amount').numFmt = '[$₹-en-IN]#,##0.00';
    total += entry.amount;
    
    if (idx % 2 === 0) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
    }
  });

  const totalRow = ws.addRow({ personName: 'TOTAL SAVINGS', amount: total });
  totalRow.font = { bold: true };
  totalRow.getCell('amount').numFmt = '[$₹-en-IN]#,##0.00';

  // --- Sheet 2: Achievements ---
  const wsAch = wb.addWorksheet('Achievements');
  wsAch.columns = [
    { header: 'Badge Name', key: 'name', width: 25 },
    { header: 'Category', key: 'category', width: 15 },
    { header: 'Description', key: 'desc', width: 40 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Unlock Date', key: 'unlockDate', width: 15 },
    { header: 'XP Earned', key: 'xp', width: 15 },
    { header: 'Progress', key: 'progress', width: 20 },
  ];

  const achHeaderRow = wsAch.getRow(1);
  achHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  achHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD97706' } }; // amber-600

  const currentProgress = calculateProgress(entries, settings);
  
  ACHIEVEMENTS.forEach((ach, idx) => {
    const unlocked = unlockedAchievements.find(u => u.id === ach.id);
    const progressVal = Math.min(ach.target, currentProgress[ach.id] || 0);
    const percentage = Math.round((progressVal / ach.target) * 100);

    const row = wsAch.addRow({
      name: ach.name,
      category: ach.category,
      desc: ach.description,
      status: unlocked ? 'Unlocked' : 'Locked',
      unlockDate: unlocked ? format(parseISO(unlocked.unlockedAt), 'yyyy-MM-dd') : '-',
      xp: unlocked ? unlocked.xpEarned : 0,
      progress: unlocked ? '100%' : `${percentage}% (${progressVal}/${ach.target})`
    });
    
    if (idx % 2 === 0) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
    }
  });

  const totalXp = unlockedAchievements.reduce((s, u) => s + u.xpEarned, 0);
  const currentLevel = getCurrentLevel(totalXp);
  const compPercent = Math.round((unlockedAchievements.length / ACHIEVEMENTS.length) * 100);

  wsAch.addRow({});
  wsAch.addRow({ name: 'SUMMARY', status: '' }).font = { bold: true };
  wsAch.addRow({ name: 'Current Level:', category: currentLevel.title });
  wsAch.addRow({ name: 'Total XP Earned:', category: totalXp });
  wsAch.addRow({ name: 'Completion %:', category: `${compPercent}%` });

  const buffer = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `Gullak_Savings_With_Achievements_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

export const exportGullakCSV = (entries: GullakEntry[], unlockedAchievements: UnlockedAchievement[], settings: any) => {
  const header = ['ID', 'Person Name', 'Amount', 'Date', 'Time', 'Payment Method', 'Category', 'Notes'];
  const rows = entries.map(e => [
    e.id, 
    `"${e.personName}"`, 
    e.amount, 
    e.date, 
    e.time, 
    e.paymentMethod, 
    e.category, 
    `"${(e.note || '').replace(/"/g, '""')}"`
  ]);
  
  let csvContent = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
  
  csvContent += '\n\n--- ACHIEVEMENTS ---\n';
  const achHeader = ['Badge Name', 'Category', 'Description', 'Status', 'Unlock Date', 'XP Earned', 'Progress'];
  
  const currentProgress = calculateProgress(entries, settings);
  const achRows = ACHIEVEMENTS.map(ach => {
    const unlocked = unlockedAchievements.find(u => u.id === ach.id);
    const progressVal = Math.min(ach.target, currentProgress[ach.id] || 0);
    const percentage = Math.round((progressVal / ach.target) * 100);
    return [
      `"${ach.name}"`,
      `"${ach.category}"`,
      `"${ach.description}"`,
      unlocked ? 'Unlocked' : 'Locked',
      unlocked ? format(parseISO(unlocked.unlockedAt), 'yyyy-MM-dd') : '-',
      unlocked ? unlocked.xpEarned : 0,
      unlocked ? '100%' : `"${percentage}% (${progressVal}/${ach.target})"`
    ];
  });
  
  csvContent += [achHeader.join(','), ...achRows.map(r => r.join(','))].join('\n');
  
  const totalXp = unlockedAchievements.reduce((s, u) => s + u.xpEarned, 0);
  const currentLevel = getCurrentLevel(totalXp);
  const compPercent = Math.round((unlockedAchievements.length / ACHIEVEMENTS.length) * 100);

  csvContent += `\n\nSUMMARY\n`;
  csvContent += `Current Level,${currentLevel.title}\n`;
  csvContent += `Total XP Earned,${totalXp}\n`;
  csvContent += `Completion %,${compPercent}%\n`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `Gullak_Savings_With_Achievements_${format(new Date(), 'yyyy-MM-dd')}.csv`);
};

export const generateAdvancedExcel = async (
  transactions: Transaction[],
  summary: {
    currentBalance: number;
    totalReceived: number;
    totalSent: number;
    totalPending: number;
  }
) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'SmartLedger';
  wb.lastModifiedBy = 'SmartLedger';
  wb.created = new Date();
  wb.modified = new Date();

  // Helper to style header row
  const styleHeader = (worksheet: ExcelJS.Worksheet) => {
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' }, // Indigo 600
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: worksheet.columns.length },
    };
  };

  const autoSizeColumns = (worksheet: ExcelJS.Worksheet) => {
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell!({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = maxLength < 10 ? 10 : maxLength > 40 ? 40 : maxLength + 2;
    });
  };

  const formatCurrency = (cell: ExcelJS.Cell) => {
    cell.numFmt = '[$₹-en-IN]#,##0.00';
  };

  const alternateRowColors = (worksheet: ExcelJS.Worksheet) => {
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: rowNumber % 2 === 0 ? 'FFF9FAFB' : 'FFFFFFFF' }, // gray-50 and white
        };
      }
    });
  };

  // --- Sheet 1: Dashboard ---
  const wsDashboard = wb.addWorksheet('Dashboard');
  wsDashboard.columns = [
    { header: 'Metric', key: 'metric', width: 25 },
    { header: 'Value', key: 'value', width: 20 },
  ];

  wsDashboard.addRow({ metric: 'Current Balance', value: summary.currentBalance });
  wsDashboard.addRow({ metric: 'Total Money Received', value: summary.totalReceived });
  wsDashboard.addRow({ metric: 'Total Money Sent', value: summary.totalSent });
  wsDashboard.addRow({ metric: 'Total Income', value: summary.totalReceived }); // assuming income is received
  wsDashboard.addRow({ metric: 'Total Expenses', value: summary.totalSent });
  wsDashboard.addRow({ metric: 'Pending Receivables', value: summary.totalPending });
  wsDashboard.addRow({ metric: 'Pending Payables', value: 0 }); // Hardcoded for now as types don't distinguish
  wsDashboard.addRow({ metric: 'Total Transactions', value: transactions.length });
  wsDashboard.addRow({ metric: 'Net Profit/Savings', value: summary.totalReceived - summary.totalSent });

  styleHeader(wsDashboard);
  wsDashboard.getColumn('value').eachCell((cell, rowNumber) => {
    if (rowNumber > 1 && rowNumber < 10) formatCurrency(cell);
  });
  autoSizeColumns(wsDashboard);

  // Helper for generating detailed sheets
  const addDetailedSheet = (
    sheetName: string,
    columns: Partial<ExcelJS.Column>[],
    dataRows: any[],
    totalColumnKey: string
  ) => {
    const ws = wb.addWorksheet(sheetName);
    ws.columns = columns;

    let totalAmount = 0;
    dataRows.forEach((row, idx) => {
      const addedRow = ws.addRow(row);
      if (row[totalColumnKey]) {
        totalAmount += Number(row[totalColumnKey]);
        formatCurrency(addedRow.getCell(totalColumnKey));
      }
    });

    // Add Total Row
    const totalRow = ws.addRow({ [columns[0].key!]: 'Total', [totalColumnKey]: totalAmount });
    totalRow.font = { bold: true };
    formatCurrency(totalRow.getCell(totalColumnKey));
    
    styleHeader(ws);
    alternateRowColors(ws);
    autoSizeColumns(ws);
  };

  // Common Transactions Mapping
  const txList = transactions.map((t) => {
    const isPending = t.type === 'pending';
    const rawDate = isPending ? (t as PendingMoney).dueDate : (t as any).date;
    const d = new Date(rawDate);
    const dateFormatted = isNaN(d.getTime()) ? rawDate : format(d, 'dd-MM-yyyy');
    const timeFormatted = isNaN(d.getTime()) ? '' : format(d, 'HH:mm');

    return {
      txId: t.id,
      date: dateFormatted,
      time: timeFormatted,
      type: t.type === 'received' ? 'Income' : t.type === 'sent' ? 'Expense' : 'Pending',
      name: t.personName,
      phone: (t as PendingMoney).phoneNumber || '',
      email: (t as PendingMoney).email || '',
      category: isPending ? 'General' : (t as any).purpose || 'General',
      amount: t.amount,
      paymentMethod: 'Bank/UPI',
      description: isPending ? (t as PendingMoney).reason : (t as any).purpose,
      status: isPending ? (t as PendingMoney).status : 'Completed',
      dueDate: isPending ? dateFormatted : '',
      daysRemaining: isPending ? Math.max(0, differenceInDays(d, new Date())) : 0,
      reminderSent: isPending ? 'Yes' : 'No'
    };
  });

  // --- Sheet 2: Money Received ---
  const receivedData = txList.filter(t => t.type === 'Income').map((t, idx) => ({
    ...t, sno: idx + 1
  }));
  addDetailedSheet('Money Received', [
    { header: 'Serial No.', key: 'sno' },
    { header: 'Received From (Name)', key: 'name' },
    { header: 'Phone Number', key: 'phone' },
    { header: 'Email (Optional)', key: 'email' },
    { header: 'Amount Received (₹)', key: 'amount' },
    { header: 'Date Received', key: 'date' },
    { header: 'Time', key: 'time' },
    { header: 'Payment Method', key: 'paymentMethod' },
    { header: 'Transaction ID', key: 'txId' },
    { header: 'Description / Reason', key: 'description' },
    { header: 'Category', key: 'category' },
    { header: 'Status', key: 'status' }
  ], receivedData, 'amount');

  // --- Sheet 3: Money Sent ---
  const sentData = txList.filter(t => t.type === 'Expense').map((t, idx) => ({
    ...t, sno: idx + 1
  }));
  addDetailedSheet('Money Sent', [
    { header: 'Serial No.', key: 'sno' },
    { header: 'Sent To (Name)', key: 'name' },
    { header: 'Phone Number', key: 'phone' },
    { header: 'Amount Sent (₹)', key: 'amount' },
    { header: 'Date', key: 'date' },
    { header: 'Time', key: 'time' },
    { header: 'Payment Method', key: 'paymentMethod' },
    { header: 'Transaction ID', key: 'txId' },
    { header: 'Purpose', key: 'description' },
    { header: 'Category', key: 'category' },
    { header: 'Status', key: 'status' }
  ], sentData, 'amount');

  // --- Sheet 4: Income --- (Alias for Money Received but specific columns)
  addDetailedSheet('Income', [
    { header: 'Date', key: 'date' },
    { header: 'Income Source', key: 'name' },
    { header: 'Category', key: 'category' },
    { header: 'Amount', key: 'amount' },
    { header: 'Description', key: 'description' }
  ], receivedData, 'amount');

  // --- Sheet 5: Expenses --- (Alias for Money Sent)
  addDetailedSheet('Expenses', [
    { header: 'Date', key: 'date' },
    { header: 'Vendor / Person', key: 'name' },
    { header: 'Category', key: 'category' },
    { header: 'Amount', key: 'amount' },
    { header: 'Payment Method', key: 'paymentMethod' },
    { header: 'Description', key: 'description' }
  ], sentData, 'amount');

  // --- Sheet 6: Pending Receivables ---
  const pendingData = txList.filter(t => t.type === 'Pending');
  addDetailedSheet('Pending Receivables', [
    { header: 'Name', key: 'name' },
    { header: 'Phone', key: 'phone' },
    { header: 'Amount Due', key: 'amount' },
    { header: 'Due Date', key: 'dueDate' },
    { header: 'Days Remaining', key: 'daysRemaining' },
    { header: 'Reminder Sent', key: 'reminderSent' },
    { header: 'Status', key: 'status' }
  ], pendingData, 'amount');

  // --- Sheet 7: Pending Payables --- (Empty for now)
  addDetailedSheet('Pending Payables', [
    { header: 'Name', key: 'name' },
    { header: 'Amount', key: 'amount' },
    { header: 'Due Date', key: 'dueDate' },
    { header: 'Priority', key: 'priority' },
    { header: 'Status', key: 'status' }
  ], [], 'amount');

  // --- Sheet 8: All Transactions ---
  addDetailedSheet('All Transactions', [
    { header: 'Transaction ID', key: 'txId' },
    { header: 'Date', key: 'date' },
    { header: 'Time', key: 'time' },
    { header: 'Type', key: 'type' },
    { header: 'Name', key: 'name' },
    { header: 'Category', key: 'category' },
    { header: 'Amount', key: 'amount' },
    { header: 'Payment Method', key: 'paymentMethod' },
    { header: 'Description', key: 'description' },
    { header: 'Status', key: 'status' }
  ], txList, 'amount');

  // --- Sheet 9: Monthly Summary ---
  const wsMonthly = wb.addWorksheet('Monthly Summary');
  wsMonthly.columns = [
    { header: 'Month', key: 'month' },
    { header: 'Income', key: 'income' },
    { header: 'Expenses', key: 'expenses' },
    { header: 'Money Received', key: 'received' },
    { header: 'Money Sent', key: 'sent' },
    { header: 'Profit', key: 'profit' },
    { header: 'Savings', key: 'savings' }
  ];

  const monthlyData: Record<string, any> = {};
  txList.forEach(t => {
    if (t.type === 'Pending') return;
    const parts = t.date.split('-'); // dd-MM-yyyy
    if (parts.length === 3) {
      const monthKey = `${parts[1]}-${parts[2]}`; // MM-yyyy
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0, received: 0, sent: 0, profit: 0, savings: 0 };
      }
      if (t.type === 'Income') {
        monthlyData[monthKey].income += t.amount;
        monthlyData[monthKey].received += t.amount;
      } else {
        monthlyData[monthKey].expenses += t.amount;
        monthlyData[monthKey].sent += t.amount;
      }
      monthlyData[monthKey].profit = monthlyData[monthKey].income - monthlyData[monthKey].expenses;
      monthlyData[monthKey].savings = monthlyData[monthKey].profit;
    }
  });

  Object.entries(monthlyData).forEach(([month, data]) => {
    const row = wsMonthly.addRow({
      month,
      income: data.income,
      expenses: data.expenses,
      received: data.received,
      sent: data.sent,
      profit: data.profit,
      savings: data.savings
    });
    ['income', 'expenses', 'received', 'sent', 'profit', 'savings'].forEach(key => {
      formatCurrency(row.getCell(key));
    });
  });

  styleHeader(wsMonthly);
  alternateRowColors(wsMonthly);
  autoSizeColumns(wsMonthly);

  // Generate file
  const buffer = await wb.xlsx.writeBuffer();
  const dateStr = format(new Date(), 'yyyy-MM-dd');
  saveAs(new Blob([buffer]), `SmartLedger_Report_${dateStr}.xlsx`);
};
