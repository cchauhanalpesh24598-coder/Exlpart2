import { ExtractedGPS } from '../types';
import { GPS_PATTERNS } from '../utils/constants';
import TextRecognition from '@react-native-ml-kit/text-recognition';

/**
 * OCR Handler - Automatic GPS Extraction from Photos
 * Uses Google ML Kit (on-device, no internet required)
 */

/**
 * Extract GPS coordinates from OCR text
 * Supports multiple formats:
 * - 22.12345N 77.12345E
 * - 22.12345, 77.12345
 * - 22°12'34.5"N 77°12'34.5"E
 */
export function extractGPSFromText(ocrText: string): ExtractedGPS | null {
  if (!ocrText || typeof ocrText !== 'string') {
    return null;
  }

  const cleanText = ocrText.replace(/\n/g, ' ').replace(/\s+/g, ' ');

  // Try standard format first: 22.12345N 77.12345E
  const standardMatch = cleanText.match(GPS_PATTERNS.standard);
  if (standardMatch) {
    return parseStandardGPS(standardMatch[0]);
  }

  // Try decimal format: 22.12345, 77.12345
  const decimalMatch = cleanText.match(GPS_PATTERNS.decimal);
  if (decimalMatch) {
    return parseDecimalGPS(decimalMatch[0]);
  }

  // Try degree format: 22°12'34.5"N
  const degreeMatch = cleanText.match(GPS_PATTERNS.degree);
  if (degreeMatch) {
    return parseDegreeGPS(degreeMatch[0]);
  }

  // Try labeled format: lat: 22.12345, lon: 77.12345
  const labeledMatch = cleanText.match(GPS_PATTERNS.labeled);
  if (labeledMatch) {
    return parseLabeledGPS(labeledMatch[0]);
  }

  return null;
}

/**
 * Parse standard GPS format: 22.12345N 77.12345E
 */
function parseStandardGPS(text: string): ExtractedGPS | null {
  const match = text.match(/(\d+\.?\d*)[°\s]*([NS])\s*[,\s]*(\d+\.?\d*)[°\s]*([EW])/i);
  
  if (!match) return null;

  const lat = match[2].toUpperCase() === 'S' ? `-${match[1]}` : match[1];
  const lon = match[4].toUpperCase() === 'W' ? `-${match[3]}` : match[3];

  return {
    latitude: lat,
    longitude: lon,
    formatted: `${match[1]}${match[2]}, ${match[3]}${match[4]}`,
    raw: text,
  };
}

/**
 * Parse decimal GPS format: 22.12345, 77.12345
 */
function parseDecimalGPS(text: string): ExtractedGPS | null {
  const match = text.match(/(\d{1,3}\.\d{4,})\s*[,\s]\s*(\d{1,3}\.\d{4,})/);
  
  if (!match) return null;

  return {
    latitude: match[1],
    longitude: match[2],
    formatted: `${match[1]}, ${match[2]}`,
    raw: text,
  };
}

/**
 * Parse degree GPS format: 22°12'34.5"N 77°12'34.5"E
 */
function parseDegreeGPS(text: string): ExtractedGPS | null {
  const match = text.match(
    /(\d+)[°]\s*(\d+)[\'′]\s*(\d+\.?\d*)[\"″]?\s*([NS])\s*[,\s]*(\d+)[°]\s*(\d+)[\'′]\s*(\d+\.?\d*)[\"″]?\s*([EW])/i
  );
  
  if (!match) return null;

  const latDecimal = dmsToDecimal(
    parseFloat(match[1]),
    parseFloat(match[2]),
    parseFloat(match[3]),
    match[4]
  );
  
  const lonDecimal = dmsToDecimal(
    parseFloat(match[5]),
    parseFloat(match[6]),
    parseFloat(match[7]),
    match[8]
  );

  return {
    latitude: latDecimal.toFixed(6),
    longitude: lonDecimal.toFixed(6),
    formatted: `${latDecimal.toFixed(6)}, ${lonDecimal.toFixed(6)}`,
    raw: text,
  };
}

/**
 * Parse labeled GPS format: lat: 22.12345, lon: 77.12345
 */
function parseLabeledGPS(text: string): ExtractedGPS | null {
  const match = text.match(
    /lat(?:itude)?\s*[:\-]?\s*(\d+\.?\d*)\s*[,\s]*lon(?:gitude)?\s*[:\-]?\s*(\d+\.?\d*)/i
  );
  
  if (!match) return null;

  return {
    latitude: match[1],
    longitude: match[2],
    formatted: `${match[1]}, ${match[2]}`,
    raw: text,
  };
}

/**
 * Convert Degrees Minutes Seconds to Decimal
 */
function dmsToDecimal(
  degrees: number,
  minutes: number,
  seconds: number,
  direction: string
): number {
  let decimal = degrees + minutes / 60 + seconds / 3600;
  
  if (direction.toUpperCase() === 'S' || direction.toUpperCase() === 'W') {
    decimal = -decimal;
  }
  
  return decimal;
}

/**
 * Validate GPS coordinates
 */
export function isValidGPS(gps: ExtractedGPS): boolean {
  const lat = parseFloat(gps.latitude);
  const lon = parseFloat(gps.longitude);

  return (
    !isNaN(lat) &&
    !isNaN(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

/**
 * Format GPS for display
 */
export function formatGPSForDisplay(gps: ExtractedGPS): string {
  return gps.formatted || `${gps.latitude}, ${gps.longitude}`;
}

/**
 * OCR Service - performs text recognition on image using ML Kit
 * Runs completely on-device - no internet required
 */
export async function performOCR(imageUri: string): Promise<string> {
  try {
    const result = await TextRecognition.recognize(imageUri);
    
    if (result && result.text) {
      return result.text;
    }
    
    return '';
  } catch (error) {
    console.error('OCR Error:', error);
    return '';
  }
}

/**
 * Process image and extract GPS - FULLY AUTOMATIC
 */
export async function processImageForGPS(imageUri: string): Promise<ExtractedGPS | null> {
  try {
    // Run ML Kit OCR on image
    const ocrText = await performOCR(imageUri);
    
    if (!ocrText) {
      return null;
    }

    // Extract GPS from OCR text
    return extractGPSFromText(ocrText);
  } catch (error) {
    console.error('GPS Extraction Error:', error);
    return null;
  }
}

/**
 * Batch process images - one per message
 * Input: Array of image URIs (first photo from each message)
 * Output: Array of GPS results
 */
export async function batchProcessImages(
  imageUris: string[],
  onProgress?: (current: number, total: number) => void
): Promise<(ExtractedGPS | null)[]> {
  const results: (ExtractedGPS | null)[] = [];
  
  for (let i = 0; i < imageUris.length; i++) {
    if (onProgress) {
      onProgress(i + 1, imageUris.length);
    }
    
    const result = await processImageForGPS(imageUris[i]);
    results.push(result);
  }
  
  return results;
}

/**
 * Manual GPS parsing from user input (backup option)
 */
export function parseManualGPSInput(input: string): ExtractedGPS | null {
  return extractGPSFromText(input);
}
