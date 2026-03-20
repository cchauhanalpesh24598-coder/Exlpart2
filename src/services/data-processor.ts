import { DataRow, SharedMessage, SharedPhoto, ExtractedMessageData, ExtractedGPS } from '../types';
import { parseWhatsAppMessage } from './regex-parser';
import { processImageForGPS } from './ocr-handler';
import { generateId } from './storage';

/**
 * Process all shared content and create data rows
 * 
 * Logic:
 * - Message 1 -> SIRF Photo 1 ka OCR -> Row 1
 * - Message 2 -> SIRF Photo 1 ka OCR -> Row 2
 * - ... (har message ke baaki photos SKIP)
 */
export async function processSharedContent(
  messages: SharedMessage[],
  photos: SharedPhoto[],
  onProgress?: (step: string, progress: number) => void
): Promise<DataRow[]> {
  const rows: DataRow[] = [];
  const totalMessages = messages.length;

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    
    // Update progress
    if (onProgress) {
      onProgress(`Processing message ${i + 1}/${totalMessages}`, (i / totalMessages) * 100);
    }

    // Step 1: Parse message with regex
    const extractedData = parseWhatsAppMessage(message.content || message.text || '');

    // Step 2: Find FIRST photo for this message (skip rest)
    // Photos are matched by order - Photo at index i goes with Message at index i
    const correspondingPhoto = photos[i];

    // Step 3: Extract GPS from first photo only
    let gpsData: ExtractedGPS | null = null;
    if (correspondingPhoto) {
      if (onProgress) {
        onProgress(`OCR on photo ${i + 1}`, ((i + 0.5) / totalMessages) * 100);
      }
      gpsData = await processImageForGPS(correspondingPhoto.uri);
    }

    // Step 4: Create row with extracted data
    const row: DataRow = {
      id: generateId(),
      bankName: extractedData.bankName,
      applicantName: extractedData.applicantName,
      status: '', // Empty - user fills
      reasonOfCNV: extractedData.reasonOfCNV,
      latlongFrom: '', // Empty - user fills
      latlongTo: gpsData ? gpsData.formatted : '', // Auto-filled from OCR
      area: '', // Empty - user fills
      km: '', // Empty - user fills
      timestamp: Date.now(),
      sourceMessageIndex: i,
      sourcePhotoUri: correspondingPhoto?.uri,
    };

    rows.push(row);
  }

  if (onProgress) {
    onProgress('Processing complete', 100);
  }

  return rows;
}

/**
 * Match messages to photos based on order
 * 
 * Structure:
 * Message 1 -> Photo 1 (first photo after message 1)
 * Message 2 -> Photo 2 (first photo after message 2)
 * ...
 */
export function matchMessagesToPhotos(
  messages: SharedMessage[],
  photos: SharedPhoto[]
): Map<number, SharedPhoto | null> {
  const mapping = new Map<number, SharedPhoto | null>();

  for (let i = 0; i < messages.length; i++) {
    // Each message gets the photo at the same index
    // If no photo available, set to null
    mapping.set(i, photos[i] || null);
  }

  return mapping;
}

/**
 * Create empty row (for manual entry)
 */
export function createEmptyRow(): DataRow {
  return {
    id: generateId(),
    bankName: '',
    applicantName: '',
    status: '',
    reasonOfCNV: '',
    latlongFrom: '',
    latlongTo: '',
    area: '',
    km: '',
    timestamp: Date.now(),
    sourceMessageIndex: -1,
  };
}

/**
 * Validate row data
 */
export function validateRow(row: DataRow): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // At least bank name or applicant name should be present
  if (!row.bankName && !row.applicantName) {
    errors.push('Bank Name or Applicant Name is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Merge manual edits with auto-extracted data
 */
export function mergeRowUpdates(
  existingRow: DataRow,
  updates: Partial<DataRow>
): DataRow {
  return {
    ...existingRow,
    ...updates,
    id: existingRow.id, // Preserve ID
    timestamp: Date.now(), // Update timestamp
  };
}

/**
 * Sort rows by timestamp
 */
export function sortRowsByTimestamp(rows: DataRow[], ascending = false): DataRow[] {
  return [...rows].sort((a, b) =>
    ascending ? a.timestamp - b.timestamp : b.timestamp - a.timestamp
  );
}

/**
 * Filter rows by search query
 */
export function filterRows(rows: DataRow[], query: string): DataRow[] {
  if (!query.trim()) return rows;

  const lowerQuery = query.toLowerCase();
  
  return rows.filter(
    (row) =>
      row.bankName.toLowerCase().includes(lowerQuery) ||
      row.applicantName.toLowerCase().includes(lowerQuery) ||
      row.reasonOfCNV.toLowerCase().includes(lowerQuery) ||
      row.area.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get auto-filled fields for highlighting
 */
export function getAutoFilledFields(row: DataRow): (keyof DataRow)[] {
  const autoFields: (keyof DataRow)[] = [];

  if (row.bankName) autoFields.push('bankName');
  if (row.applicantName) autoFields.push('applicantName');
  if (row.reasonOfCNV) autoFields.push('reasonOfCNV');
  if (row.latlongTo) autoFields.push('latlongTo');

  return autoFields;
}
