import { TableColumn } from '../types';

// Regex Patterns for WhatsApp Message Parsing
export const REGEX_PATTERNS = {
  // Bank Name - text inside parentheses at the end
  // Example: "R.v(Fedbank)" → "Fedbank"
  // Example: "xyz(HDFC Bank)" → "HDFC Bank"
  bankName: /\(([^)]+)\)\s*$/,

  // Applicant Name - after "applicant:-" or "applicant:" or "applicant -"
  // Example: "applicant:- Ramesh Kumar" → "Ramesh Kumar"
  // Example: "applicant: John Doe" → "John Doe"
  applicantName: /applicant\s*[:\-]+\s*(.+?)(?:\n|$)/i,

  // Reason of CNV - first line of message (before any parentheses or newline)
  // Example: "Property Visit Report\n..." → "Property Visit Report"
  reasonOfCNV: /^([^\n(]+)/,

  // Alternative patterns for flexibility
  bankNameAlt: /bank\s*[:\-]+\s*(.+?)(?:\n|$)/i,
  applicantNameAlt: /name\s*[:\-]+\s*(.+?)(?:\n|$)/i,
};

// GPS Extraction Patterns from OCR Text
export const GPS_PATTERNS = {
  // Standard format: 22.12345N 77.12345E
  standard: /(\d+\.?\d*)[°\s]*([NS])\s*[,\s]*(\d+\.?\d*)[°\s]*([EW])/gi,

  // Decimal format: 22.12345, 77.12345
  decimal: /(\d{1,3}\.\d{4,})\s*[,\s]\s*(\d{1,3}\.\d{4,})/g,

  // Degree format: 22°12'34.5"N 77°12'34.5"E
  degree: /(\d+)[°]\s*(\d+)[\'′]\s*(\d+\.?\d*)[\"″]?\s*([NS])\s*[,\s]*(\d+)[°]\s*(\d+)[\'′]\s*(\d+\.?\d*)[\"″]?\s*([EW])/gi,

  // Simple lat/long labeled
  labeled: /lat(?:itude)?\s*[:\-]?\s*(\d+\.?\d*)\s*[,\s]*lon(?:gitude)?\s*[:\-]?\s*(\d+\.?\d*)/gi,
};

// Table Columns Configuration
export const TABLE_COLUMNS: TableColumn[] = [
  { key: 'bankName', label: 'Bank Name', editable: true, autoFilled: true, width: 100 },
  { key: 'applicantName', label: 'Applicant', editable: true, autoFilled: true, width: 120 },
  { key: 'status', label: 'Status', editable: true, autoFilled: false, width: 80 },
  { key: 'reasonOfCNV', label: 'Reason', editable: true, autoFilled: true, width: 150 },
  { key: 'latlongFrom', label: 'Latlong From', editable: true, autoFilled: false, width: 130 },
  { key: 'latlongTo', label: 'Latlong To', editable: true, autoFilled: true, width: 130 },
  { key: 'area', label: 'Area', editable: true, autoFilled: false, width: 100 },
  { key: 'km', label: 'KM', editable: true, autoFilled: false, width: 60 },
];

// Status Options for Dropdown
export const STATUS_OPTIONS = [
  'Completed',
  'Pending',
  'In Progress',
  'Cancelled',
  'Verified',
  'Not Verified',
];

// App Colors
export const COLORS = {
  primary: '#1a73e8',
  primaryLight: '#e8f0fe',
  secondary: '#34a853',
  warning: '#fbbc04',
  error: '#ea4335',
  background: '#f8f9fa',
  surface: '#ffffff',
  text: '#202124',
  textSecondary: '#5f6368',
  border: '#dadce0',
  autoFilledBg: '#e3f2fd',
  emptyBg: '#ffffff',
};

// Storage Keys
export const STORAGE_KEYS = {
  savedRows: 'ocr_excel_saved_rows',
  appSettings: 'ocr_excel_settings',
  lastExport: 'ocr_excel_last_export',
};

// Excel Export Settings
export const EXCEL_SETTINGS = {
  fileName: 'OCR_Data_Export',
  sheetName: 'Data',
  headers: [
    'Bank Name',
    'Applicant Name',
    'Status',
    'Reason of CNV',
    'Latlong From',
    'Latlong To',
    'Area',
    'KM',
  ],
};
