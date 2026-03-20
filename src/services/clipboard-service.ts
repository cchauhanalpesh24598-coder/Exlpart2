import * as Clipboard from 'expo-clipboard';
import { parseWhatsAppMessage } from './regex-parser';
import { ExtractedMessageData } from '../types';

/**
 * Clipboard Service
 * WhatsApp se copy kiye gaye messages ko automatically detect karta hai
 */

let lastClipboardContent = '';
let clipboardCheckInterval: NodeJS.Timeout | null = null;

/**
 * Get current clipboard content
 */
export async function getClipboardContent(): Promise<string> {
  try {
    const content = await Clipboard.getStringAsync();
    return content || '';
  } catch (error) {
    console.error('Clipboard read error:', error);
    return '';
  }
}

/**
 * Check if clipboard content is new
 */
export async function hasNewClipboardContent(): Promise<boolean> {
  const currentContent = await getClipboardContent();
  if (currentContent && currentContent !== lastClipboardContent) {
    lastClipboardContent = currentContent;
    return true;
  }
  return false;
}

/**
 * Start clipboard monitoring
 * Jab user WhatsApp se kuch copy karega, ye detect karega
 */
export function startClipboardMonitoring(
  onNewContent: (content: string, parsed: ExtractedMessageData) => void,
  intervalMs: number = 1000
): () => void {
  // Clear any existing interval
  if (clipboardCheckInterval) {
    clearInterval(clipboardCheckInterval);
  }

  clipboardCheckInterval = setInterval(async () => {
    try {
      const currentContent = await getClipboardContent();
      
      if (currentContent && currentContent !== lastClipboardContent) {
        lastClipboardContent = currentContent;
        
        // Parse the message
        const parsed = parseWhatsAppMessage(currentContent);
        
        // Notify callback
        onNewContent(currentContent, parsed);
      }
    } catch (error) {
      console.error('Clipboard monitoring error:', error);
    }
  }, intervalMs);

  // Return cleanup function
  return () => {
    if (clipboardCheckInterval) {
      clearInterval(clipboardCheckInterval);
      clipboardCheckInterval = null;
    }
  };
}

/**
 * Stop clipboard monitoring
 */
export function stopClipboardMonitoring(): void {
  if (clipboardCheckInterval) {
    clearInterval(clipboardCheckInterval);
    clipboardCheckInterval = null;
  }
}

/**
 * Reset last clipboard content (useful when starting new session)
 */
export function resetClipboardState(): void {
  lastClipboardContent = '';
}

/**
 * Check if message looks like WhatsApp content
 */
export function isWhatsAppMessage(content: string): boolean {
  if (!content) return false;
  
  // Check for common WhatsApp patterns
  const patterns = [
    /applicant/i,
    /\([^)]+bank[^)]*\)/i,
    /\[?\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/,  // Date format
    /property|visit|report|cnv|verification/i,
  ];
  
  return patterns.some(pattern => pattern.test(content));
}
