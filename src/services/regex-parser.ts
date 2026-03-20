import { ExtractedMessageData } from '../types';
import { REGEX_PATTERNS } from '../utils/constants';

/**
 * Parse WhatsApp message and extract Bank Name, Applicant Name, Reason of CNV
 */
export function parseWhatsAppMessage(messageText: string): ExtractedMessageData {
  const result: ExtractedMessageData = {
    bankName: '',
    applicantName: '',
    reasonOfCNV: '',
  };

  if (!messageText || typeof messageText !== 'string') {
    return result;
  }

  // Clean the message text
  const cleanText = messageText.trim();

  // Extract Bank Name - look for text in parentheses at the end
  const bankMatch = cleanText.match(REGEX_PATTERNS.bankName);
  if (bankMatch && bankMatch[1]) {
    result.bankName = bankMatch[1].trim();
  } else {
    // Try alternative pattern
    const bankAltMatch = cleanText.match(REGEX_PATTERNS.bankNameAlt);
    if (bankAltMatch && bankAltMatch[1]) {
      result.bankName = bankAltMatch[1].trim();
    }
  }

  // Extract Applicant Name
  const applicantMatch = cleanText.match(REGEX_PATTERNS.applicantName);
  if (applicantMatch && applicantMatch[1]) {
    result.applicantName = applicantMatch[1].trim();
  } else {
    // Try alternative pattern
    const applicantAltMatch = cleanText.match(REGEX_PATTERNS.applicantNameAlt);
    if (applicantAltMatch && applicantAltMatch[1]) {
      result.applicantName = applicantAltMatch[1].trim();
    }
  }

  // Extract Reason of CNV - first line before parentheses
  const reasonMatch = cleanText.match(REGEX_PATTERNS.reasonOfCNV);
  if (reasonMatch && reasonMatch[1]) {
    result.reasonOfCNV = reasonMatch[1].trim();
  }

  return result;
}

/**
 * Parse multiple messages and return array of extracted data
 */
export function parseMultipleMessages(messages: string[]): ExtractedMessageData[] {
  return messages.map((msg) => parseWhatsAppMessage(msg));
}

/**
 * Validate extracted data - check if at least one field is populated
 */
export function isValidExtraction(data: ExtractedMessageData): boolean {
  return !!(data.bankName || data.applicantName || data.reasonOfCNV);
}

/**
 * Clean and normalize extracted text
 */
export function cleanExtractedText(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/\s+/g, ' ')  // Multiple spaces to single
    .replace(/^\s+|\s+$/g, '')  // Trim
    .replace(/[^\w\s\-.,]/g, '')  // Remove special chars except basic punctuation
    .trim();
}

/**
 * Try to extract bank name from various formats
 */
export function extractBankName(text: string): string {
  // Common bank name patterns
  const patterns = [
    /\(([^)]*bank[^)]*)\)/i,  // (HDFC Bank)
    /\(([^)]+)\)\s*$/,  // Last parentheses
    /bank\s*[:\-]\s*([^\n]+)/i,  // bank: HDFC
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return '';
}

/**
 * Try to extract applicant name from various formats
 */
export function extractApplicantName(text: string): string {
  const patterns = [
    /applicant\s*[:\-]+\s*(.+?)(?:\n|$)/i,
    /name\s*[:\-]+\s*(.+?)(?:\n|$)/i,
    /customer\s*[:\-]+\s*(.+?)(?:\n|$)/i,
    /client\s*[:\-]+\s*(.+?)(?:\n|$)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return '';
}
