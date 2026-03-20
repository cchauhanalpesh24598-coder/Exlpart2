import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { DataRow } from '../types';
import { EXCEL_SETTINGS } from '../utils/constants';

/**
 * Convert DataRow array to Excel workbook
 */
function createWorkbook(rows: DataRow[]): XLSX.WorkBook {
  // Prepare data array with headers
  const data: string[][] = [
    EXCEL_SETTINGS.headers,
    ...rows.map((row) => [
      row.bankName || '',
      row.applicantName || '',
      row.status || '',
      row.reasonOfCNV || '',
      row.latlongFrom || '',
      row.latlongTo || '',
      row.area || '',
      row.km || '',
    ]),
  ];

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 15 },  // Bank Name
    { wch: 20 },  // Applicant Name
    { wch: 12 },  // Status
    { wch: 25 },  // Reason of CNV
    { wch: 20 },  // Latlong From
    { wch: 20 },  // Latlong To
    { wch: 15 },  // Area
    { wch: 10 },  // KM
  ];

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, EXCEL_SETTINGS.sheetName);

  return workbook;
}

/**
 * Generate Excel file and return the file path
 */
export async function generateExcelFile(rows: DataRow[]): Promise<string | null> {
  try {
    // Create workbook
    const workbook = createWorkbook(rows);

    // Generate binary string
    const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });

    // Create file name with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `${EXCEL_SETTINGS.fileName}_${timestamp}.xlsx`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    // Write file
    await FileSystem.writeAsStringAsync(filePath, wbout, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return filePath;
  } catch (error) {
    console.error('Error generating Excel file:', error);
    return null;
  }
}

/**
 * Export and share Excel file
 */
export async function exportAndShareExcel(rows: DataRow[]): Promise<boolean> {
  try {
    const filePath = await generateExcelFile(rows);
    
    if (!filePath) {
      throw new Error('Failed to generate Excel file');
    }

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    
    if (isAvailable) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Export Excel File',
        UTI: 'com.microsoft.excel.xlsx',
      });
      return true;
    } else {
      console.log('Sharing is not available on this device');
      return false;
    }
  } catch (error) {
    console.error('Error exporting Excel:', error);
    return false;
  }
}

/**
 * Save Excel file to device storage
 */
export async function saveExcelToDevice(rows: DataRow[]): Promise<string | null> {
  try {
    const filePath = await generateExcelFile(rows);
    
    if (!filePath) {
      throw new Error('Failed to generate Excel file');
    }

    // Copy to downloads directory if available
    const downloadDir = FileSystem.documentDirectory;
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `${EXCEL_SETTINGS.fileName}_${timestamp}.xlsx`;
    const destinationPath = `${downloadDir}${fileName}`;

    // File is already at the destination
    return destinationPath;
  } catch (error) {
    console.error('Error saving Excel to device:', error);
    return null;
  }
}

/**
 * Convert rows to CSV format
 */
export function convertToCSV(rows: DataRow[]): string {
  const headers = EXCEL_SETTINGS.headers.join(',');
  
  const csvRows = rows.map((row) =>
    [
      escapeCSVField(row.bankName),
      escapeCSVField(row.applicantName),
      escapeCSVField(row.status),
      escapeCSVField(row.reasonOfCNV),
      escapeCSVField(row.latlongFrom),
      escapeCSVField(row.latlongTo),
      escapeCSVField(row.area),
      escapeCSVField(row.km),
    ].join(',')
  );

  return [headers, ...csvRows].join('\n');
}

/**
 * Escape CSV field (handle commas and quotes)
 */
function escapeCSVField(field: string): string {
  if (!field) return '';
  
  // If field contains comma, newline, or quote, wrap in quotes
  if (field.includes(',') || field.includes('\n') || field.includes('"')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  
  return field;
}

/**
 * Export as CSV file
 */
export async function exportCSV(rows: DataRow[]): Promise<string | null> {
  try {
    const csvContent = convertToCSV(rows);
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `${EXCEL_SETTINGS.fileName}_${timestamp}.csv`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    return filePath;
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return null;
  }
}
