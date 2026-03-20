import { NativeModules, Platform, NativeEventEmitter } from 'react-native';

/**
 * OverlayModule - React Native wrapper for native Android overlay service
 * 
 * Ye module floating bubble ko system-wide overlay ke roop me control karta hai.
 * Bubble app ke bahar bhi visible rehta hai (WhatsApp, home screen, etc.)
 */

interface OverlayModuleType {
  checkOverlayPermission: () => Promise<boolean>;
  requestOverlayPermission: () => Promise<boolean>;
  startOverlay: () => Promise<boolean>;
  stopOverlay: () => Promise<boolean>;
  updateBubbleState: (state: BubbleState) => Promise<boolean>;
  isOverlayRunning: () => Promise<boolean>;
}

export interface BubbleState {
  rowNumber: number;
  progress: number; // 0 to 1
  gps?: string;
  hasError?: boolean;
}

// Get native module (Android only)
const NativeOverlayModule = Platform.OS === 'android' 
  ? NativeModules.OverlayModule as OverlayModuleType
  : null;

/**
 * Check if overlay permission is granted
 */
export async function checkOverlayPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    console.warn('Overlay is only supported on Android');
    return false;
  }
  
  if (!NativeOverlayModule) {
    console.error('OverlayModule not found. Make sure native module is properly linked.');
    return false;
  }
  
  try {
    return await NativeOverlayModule.checkOverlayPermission();
  } catch (error) {
    console.error('Error checking overlay permission:', error);
    return false;
  }
}

/**
 * Request overlay permission - opens system settings
 * Returns true if already granted, false if user needs to grant
 */
export async function requestOverlayPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }
  
  if (!NativeOverlayModule) {
    return false;
  }
  
  try {
    return await NativeOverlayModule.requestOverlayPermission();
  } catch (error) {
    console.error('Error requesting overlay permission:', error);
    return false;
  }
}

/**
 * Start the overlay service - bubble will appear on screen
 */
export async function startOverlay(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }
  
  if (!NativeOverlayModule) {
    return false;
  }
  
  try {
    // First check permission
    const hasPermission = await checkOverlayPermission();
    if (!hasPermission) {
      // Request permission
      await requestOverlayPermission();
      return false; // User needs to grant and try again
    }
    
    return await NativeOverlayModule.startOverlay();
  } catch (error) {
    console.error('Error starting overlay:', error);
    return false;
  }
}

/**
 * Stop the overlay service - bubble will disappear
 */
export async function stopOverlay(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }
  
  if (!NativeOverlayModule) {
    return false;
  }
  
  try {
    return await NativeOverlayModule.stopOverlay();
  } catch (error) {
    console.error('Error stopping overlay:', error);
    return false;
  }
}

/**
 * Update bubble state - row number, progress, GPS, etc.
 */
export async function updateBubbleState(state: BubbleState): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }
  
  if (!NativeOverlayModule) {
    return false;
  }
  
  try {
    return await NativeOverlayModule.updateBubbleState(state);
  } catch (error) {
    console.error('Error updating bubble state:', error);
    return false;
  }
}

/**
 * Check if overlay service is currently running
 */
export async function isOverlayRunning(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }
  
  if (!NativeOverlayModule) {
    return false;
  }
  
  try {
    return await NativeOverlayModule.isOverlayRunning();
  } catch (error) {
    console.error('Error checking overlay status:', error);
    return false;
  }
}

/**
 * Hook for using overlay module with automatic state sync
 */
export function useOverlaySync(
  rowNumber: number,
  progress: number,
  gps: string | null,
  hasError: boolean
) {
  // Sync state to native overlay whenever it changes
  if (Platform.OS === 'android' && NativeOverlayModule) {
    updateBubbleState({
      rowNumber,
      progress,
      gps: gps || undefined,
      hasError,
    }).catch(console.error);
  }
}
