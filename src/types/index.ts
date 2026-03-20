// Data Row Interface - Each row in the table
export interface DataRow {
  id: string;
  bankName: string;
  applicantName: string;
  status: string;
  reasonOfCNV: string;
  latlongFrom: string;
  latlongTo: string;
  area: string;
  km: string;
  timestamp: number;
  sourceMessageIndex: number;
  sourcePhotoUri?: string;
}

// Shared Content from WhatsApp
export interface SharedMessage {
  id: string;
  text?: string;
  content?: string;
  sender?: string;
  timestamp: string | number;
  index?: number;
  parsedContent?: string;
}

export interface SharedPhoto {
  id: string;
  uri: string;
  mimeType?: string;
  timestamp: string | number;
  index?: number;
  messageIndex?: number;
}

// App State
export interface AppState {
  messages: SharedMessage[];
  photos: SharedPhoto[];
  rows: DataRow[];
  isProcessing: boolean;
  processingStep: string;
}

// Extracted Data from Regex
export interface ExtractedMessageData {
  bankName: string;
  applicantName: string;
  reasonOfCNV: string;
}

// Extracted GPS from OCR
export interface ExtractedGPS {
  latitude: string;
  longitude: string;
  formatted: string;
  raw?: string;
}

// Column Definition for Table
export interface TableColumn {
  key: keyof DataRow;
  label: string;
  editable: boolean;
  autoFilled: boolean;
  width: number;
}

// Export Types
export type ExportFormat = 'xlsx' | 'csv';

// Processing Progress
export interface ProcessingProgress {
  current: number;
  total: number;
  step: string;
  percentage: number;
}
