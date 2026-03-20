import { ExtractedGPS } from '../types';

/**
 * Screen Capture Service
 * Image se lat-long extract karta hai (bottom-right area se)
 * 
 * Example input format:
 * "Mar 20,2026 10:03am 22.1234N 71.1234E
 *  Vajsurpara Jasdan Gujarat"
 * 
 * Output format: "22.1234,71.1234"
 */

// GPS extraction patterns specifically for the format mentioned
const GPS_EXTRACTION_PATTERNS = {
  // Format: 22.1234N 71.1234E
  standardNE: /(\d{1,3}\.\d{2,6})\s*([NS])\s+(\d{1,3}\.\d{2,6})\s*([EW])/gi,
  
  // Format with degrees symbol: 22.1234°N 71.1234°E
  withDegree: /(\d{1,3}\.\d{2,6})[°]?\s*([NS])\s*[,\s]*(\d{1,3}\.\d{2,6})[°]?\s*([EW])/gi,
  
  // Simple decimal format: 22.1234, 71.1234
  decimal: /(\d{1,3}\.\d{4,})\s*[,\s]\s*(\d{1,3}\.\d{4,})/g,
};

/**
 * Extract GPS from OCR text (specifically from bottom-right area)
 * Input: OCR text from image
 * Output: Formatted string "lat,long" or null
 */
export function extractLatLongFromText(ocrText: string): { 
  formatted: string; 
  latitude: string; 
  longitude: string;
  raw: string;
} | null {
  if (!ocrText || typeof ocrText !== 'string') {
    return null;
  }

  // Clean the text
  const cleanText = ocrText.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Try standard format first: 22.1234N 71.1234E
  const standardMatch = cleanText.match(GPS_EXTRACTION_PATTERNS.standardNE);
  if (standardMatch && standardMatch.length > 0) {
    const result = parseStandardFormat(standardMatch[0]);
    if (result) return result;
  }

  // Try with degree symbol
  const degreeMatch = cleanText.match(GPS_EXTRACTION_PATTERNS.withDegree);
  if (degreeMatch && degreeMatch.length > 0) {
    const result = parseStandardFormat(degreeMatch[0]);
    if (result) return result;
  }

  // Try decimal format
  const decimalMatch = cleanText.match(GPS_EXTRACTION_PATTERNS.decimal);
  if (decimalMatch && decimalMatch.length > 0) {
    const result = parseDecimalFormat(decimalMatch[0]);
    if (result) return result;
  }

  return null;
}

/**
 * Parse standard GPS format: 22.1234N 71.1234E
 */
function parseStandardFormat(text: string): { 
  formatted: string; 
  latitude: string; 
  longitude: string;
  raw: string;
} | null {
  const match = text.match(/(\d{1,3}\.\d{2,6})\s*([NS])\s*[,\s]*(\d{1,3}\.\d{2,6})\s*([EW])/i);
  
  if (!match) return null;

  let lat = match[1];
  let lon = match[3];
  
  // Add negative sign for S and W
  if (match[2].toUpperCase() === 'S') lat = `-${lat}`;
  if (match[4].toUpperCase() === 'W') lon = `-${lon}`;

  return {
    latitude: lat,
    longitude: lon,
    formatted: `${lat},${lon}`,
    raw: text,
  };
}

/**
 * Parse decimal GPS format: 22.1234, 71.1234
 */
function parseDecimalFormat(text: string): { 
  formatted: string; 
  latitude: string; 
  longitude: string;
  raw: string;
} | null {
  const match = text.match(/(\d{1,3}\.\d{4,})\s*[,\s]\s*(\d{1,3}\.\d{4,})/);
  
  if (!match) return null;

  return {
    latitude: match[1],
    longitude: match[2],
    formatted: `${match[1]},${match[2]}`,
    raw: text,
  };
}

/**
 * Manual GPS input parser
 * User manually enter kar sakta hai agar OCR fail ho
 */
export function parseManualGPSInput(input: string): { 
  formatted: string; 
  latitude: string; 
  longitude: string;
} | null {
  if (!input) return null;
  
  // Clean input
  const clean = input.trim();
  
  // Try all patterns
  const result = extractLatLongFromText(clean);
  if (result) {
    return {
      formatted: result.formatted,
      latitude: result.latitude,
      longitude: result.longitude,
    };
  }
  
  // Try simple comma-separated format
  const parts = clean.split(/[,\s]+/);
  if (parts.length >= 2) {
    const lat = parseFloat(parts[0]);
    const lon = parseFloat(parts[1]);
    
    if (!isNaN(lat) && !isNaN(lon)) {
      return {
        latitude: parts[0],
        longitude: parts[1],
        formatted: `${parts[0]},${parts[1]}`,
      };
    }
  }
  
  return null;
}

/**
 * Validate GPS coordinates
 */
export function isValidGPSCoordinate(lat: string | number, lon: string | number): boolean {
  const latNum = typeof lat === 'string' ? parseFloat(lat) : lat;
  const lonNum = typeof lon === 'string' ? parseFloat(lon) : lon;
  
  return (
    !isNaN(latNum) &&
    !isNaN(lonNum) &&
    latNum >= -90 &&
    latNum <= 90 &&
    lonNum >= -180 &&
    lonNum <= 180
  );
}
