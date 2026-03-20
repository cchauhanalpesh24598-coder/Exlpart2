import { SharedMessage, SharedPhoto } from '../types';
import { generateId } from './storage';
import ShareMenu from 'react-native-share-menu';

/**
 * Share Intent Handler
 * Handles content shared from WhatsApp and other apps
 */

interface ShareItem {
  mimeType: string;
  data: string;
  extraData?: any;
}

/**
 * Check if app was opened via share intent
 */
export async function checkShareIntent(): Promise<{
  hasSharedContent: boolean;
  messages: SharedMessage[];
  photos: SharedPhoto[];
}> {
  return new Promise((resolve) => {
    ShareMenu.getInitialShare((share: ShareItem | ShareItem[] | null) => {
      if (!share) {
        resolve({ hasSharedContent: false, messages: [], photos: [] });
        return;
      }

      const items = Array.isArray(share) ? share : [share];
      const result = processShareItems(items);
      resolve(result);
    });
  });
}

/**
 * Subscribe to new share events (when app is already open)
 */
export function subscribeToShareEvents(
  callback: (data: { messages: SharedMessage[]; photos: SharedPhoto[] }) => void
): () => void {
  const listener = ShareMenu.addNewShareListener((share: ShareItem | ShareItem[]) => {
    const items = Array.isArray(share) ? share : [share];
    const result = processShareItems(items);
    callback({ messages: result.messages, photos: result.photos });
  });

  return () => {
    listener.remove();
  };
}

/**
 * Process share items into messages and photos
 */
function processShareItems(items: ShareItem[]): {
  hasSharedContent: boolean;
  messages: SharedMessage[];
  photos: SharedPhoto[];
} {
  const messages: SharedMessage[] = [];
  const photos: SharedPhoto[] = [];

  items.forEach((item, index) => {
    if (item.mimeType.startsWith('text/')) {
      // Text message
      const parsed = parseWhatsAppForward(item.data);
      messages.push({
        id: generateId(),
        content: item.data,
        sender: parsed.sender,
        timestamp: parsed.timestamp || new Date().toISOString(),
        parsedContent: parsed.content,
      });
    } else if (item.mimeType.startsWith('image/')) {
      // Image/Photo
      photos.push({
        id: generateId(),
        uri: item.data,
        mimeType: item.mimeType,
        timestamp: new Date().toISOString(),
        index: index,
      });
    }
  });

  return {
    hasSharedContent: messages.length > 0 || photos.length > 0,
    messages,
    photos,
  };
}

/**
 * Clear received share data
 */
export function clearShareData(): void {
  ShareMenu.clearSharedData();
}

/**
 * Parse WhatsApp forward format
 * Format: [DD/MM/YY, HH:MM] Sender Name: Message content
 */
export function parseWhatsAppForward(text: string): {
  sender: string;
  timestamp: string;
  content: string;
} {
  // WhatsApp forward pattern
  const forwardPattern = /\[(\d{1,2}\/\d{1,2}\/\d{2,4},\s*\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)\]\s*([^:]+):\s*([\s\S]*)/;
  
  const match = text.match(forwardPattern);
  
  if (match) {
    return {
      timestamp: match[1],
      sender: match[2].trim(),
      content: match[3].trim(),
    };
  }

  // Simple format without timestamp
  const simplePattern = /^([^:]+):\s*([\s\S]*)/;
  const simpleMatch = text.match(simplePattern);
  
  if (simpleMatch) {
    return {
      sender: simpleMatch[1].trim(),
      timestamp: new Date().toISOString(),
      content: simpleMatch[2].trim(),
    };
  }

  return {
    sender: '',
    timestamp: new Date().toISOString(),
    content: text,
  };
}

/**
 * Group photos by their corresponding message
 * Logic: Every set of 10 photos belongs to one message
 */
export function groupPhotosByMessage(
  photos: SharedPhoto[],
  messageCount: number
): Map<number, SharedPhoto[]> {
  const grouped = new Map<number, SharedPhoto[]>();

  for (let i = 0; i < messageCount; i++) {
    grouped.set(i, []);
  }

  // Sort photos by index/timestamp
  const sortedPhotos = [...photos].sort((a, b) => (a.index || 0) - (b.index || 0));

  sortedPhotos.forEach((photo, index) => {
    const messageIndex = Math.floor(index / 10);
    if (messageIndex < messageCount) {
      const existing = grouped.get(messageIndex) || [];
      existing.push(photo);
      grouped.set(messageIndex, existing);
    }
  });

  return grouped;
}

/**
 * Get first photo for each message (used for OCR)
 * IMPORTANT: Sirf pehli photo use hogi har message ke liye
 */
export function getFirstPhotoPerMessage(
  photos: SharedPhoto[],
  messageCount: number
): SharedPhoto[] {
  const firstPhotos: SharedPhoto[] = [];
  const grouped = groupPhotosByMessage(photos, messageCount);

  for (let i = 0; i < messageCount; i++) {
    const messagePhotos = grouped.get(i) || [];
    if (messagePhotos.length > 0) {
      firstPhotos.push(messagePhotos[0]);
    }
  }

  return firstPhotos;
}

/**
 * Match messages with their corresponding first photos
 */
export function matchMessagesWithPhotos(
  messages: SharedMessage[],
  photos: SharedPhoto[]
): Array<{ message: SharedMessage; photo: SharedPhoto | null }> {
  const firstPhotos = getFirstPhotoPerMessage(photos, messages.length);
  
  return messages.map((message, index) => ({
    message,
    photo: firstPhotos[index] || null,
  }));
}
