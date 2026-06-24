import { Parser } from 'json2csv';
import ExcelJS from 'exceljs';

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

export async function generateCsvBuffer(data: any[], columns: ExportColumn[]): Promise<Buffer> {
  const fields = columns.map(c => ({ label: c.header, value: c.key }));
  const parser = new Parser({ fields });
  const csv = parser.parse(data);
  return Buffer.from(csv, 'utf-8');
}

export async function generateExcelBuffer(data: any[], columns: ExportColumn[], sheetName = 'Export'): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  worksheet.columns = columns.map(c => ({
    header: c.header,
    key: c.key,
    width: c.width || 20,
  }));

  // Style header
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  data.forEach(item => {
    worksheet.addRow(item);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
