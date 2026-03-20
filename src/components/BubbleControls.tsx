import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { useBubble } from '../context/BubbleContext';
import { COLORS } from '../utils/constants';
import {
  checkOverlayPermission,
  requestOverlayPermission,
  startOverlay,
  stopOverlay,
  updateBubbleState,
} from '../native/OverlayModule';

/**
 * BubbleControls Component
 * 
 * Bubble ko enable/disable karne ka UI
 * Home screen ya kisi bhi screen pe use ho sakta hai
 */

interface BubbleControlsProps {
  onDataReady?: () => void;
}

export function BubbleControls({ onDataReady }: BubbleControlsProps) {
  const {
    isBubbleEnabled,
    setBubbleEnabled,
    collectedRows,
    clearAllRows,
    convertToDataRows,
    currentRowNumber,
    currentRowStatus,
    lastScannedGPS,
    scanError,
  } = useBubble();

  const [hasOverlayPermission, setHasOverlayPermission] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(false);

  const completedRows = collectedRows.filter(r => r.status === 'full').length;
  const halfRows = collectedRows.filter(r => r.status === 'half').length;

  // Check overlay permission on mount
  useEffect(() => {
    if (Platform.OS === 'android') {
      checkOverlayPermission().then(setHasOverlayPermission);
    }
  }, []);

  // Sync state to native overlay
  useEffect(() => {
    if (Platform.OS === 'android' && isBubbleEnabled && hasOverlayPermission) {
      const progress = currentRowStatus === 'full' ? 1 : currentRowStatus === 'half' ? 0.5 : 0;
      updateBubbleState({
        rowNumber: currentRowNumber,
        progress,
        gps: lastScannedGPS || undefined,
        hasError: !!scanError,
      });
    }
  }, [currentRowNumber, currentRowStatus, lastScannedGPS, scanError, isBubbleEnabled, hasOverlayPermission]);

  const openOverlaySettings = async () => {
    try {
      // Direct intent to overlay settings for this app
      const packageName = 'com.ocrexcel.app';
      const overlaySettingsUrl = `package:${packageName}`;
      
      // Try opening overlay permission settings directly
      const canOpen = await Linking.canOpenURL('package:com.ocrexcel.app');
      
      if (canOpen) {
        await Linking.openURL(overlaySettingsUrl);
      } else {
        // Fallback: Open app settings
        await Linking.openSettings();
      }
    } catch (error) {
      console.log('[v0] Error opening settings:', error);
      // Final fallback
      try {
        await Linking.openSettings();
      } catch (e) {
        Alert.alert(
          'Cannot Open Settings',
          'Please manually go to:\nSettings > Apps > OCR Excel App > Display over other apps'
        );
      }
    }
  };

  const handleToggle = async () => {
    if (Platform.OS === 'android') {
      if (!isBubbleEnabled) {
        // For now, since native module may not be linked yet,
        // we'll show the in-app bubble and guide user for system overlay
        
        // Check if native module is available
        const nativeModuleAvailable = await checkOverlayPermission().catch(() => false);
        
        if (nativeModuleAvailable === false) {
          // Native module not available - use in-app bubble only
          Alert.alert(
            'Bubble Mode',
            'Bubble ab app ke andar kaam karega. System-wide overlay ke liye app rebuild karna hoga native module ke saath.\n\nAbhi in-app bubble enable kare?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Enable In-App',
                onPress: () => {
                  setBubbleEnabled(true);
                },
              },
            ]
          );
          return;
        }

        // Native module available - check permission
        setIsCheckingPermission(true);
        const hasPermission = await checkOverlayPermission();
        setIsCheckingPermission(false);

        if (!hasPermission) {
          Alert.alert(
            'Permission Required',
            'Bubble ko har app ke upar dikhane ke liye "Draw over other apps" permission chahiye.\n\nSettings > Apps > OCR Excel App > Display over other apps > Allow',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Open Settings',
                onPress: async () => {
                  await openOverlaySettings();
                  // Re-check after user returns (with longer delay)
                  setTimeout(async () => {
                    const granted = await checkOverlayPermission();
                    setHasOverlayPermission(granted);
                    if (granted) {
                      setBubbleEnabled(true);
                      await startOverlay();
                    }
                  }, 2000);
                },
              },
            ]
          );
          return;
        }

        // Permission granted - start overlay
        setHasOverlayPermission(true);
        setBubbleEnabled(true);
        await startOverlay();
      } else {
        // Disabling bubble
        setBubbleEnabled(false);
        await stopOverlay();
      }
    } else {
      // iOS or other platforms - just toggle in-app bubble
      setBubbleEnabled(!isBubbleEnabled);
    }
  };

  const handleProcessData = () => {
    if (onDataReady) {
      onDataReady();
    }
  };

  return (
    <View style={styles.container}>
      {/* Toggle Button */}
      <TouchableOpacity
        style={[
          styles.toggleButton,
          isBubbleEnabled && styles.toggleButtonActive,
        ]}
        onPress={handleToggle}
      >
        <View style={styles.toggleContent}>
          <View style={[styles.toggleDot, isBubbleEnabled && styles.toggleDotActive]} />
          <Text style={[styles.toggleText, isBubbleEnabled && styles.toggleTextActive]}>
            {isBubbleEnabled ? 'Bubble Active' : 'Enable Bubble'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Status Panel */}
      {isBubbleEnabled && (
        <View style={styles.statusPanel}>
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Text style={styles.statusNumber}>{currentRowNumber}</Text>
              <Text style={styles.statusLabel}>Current Row</Text>
            </View>
            <View style={styles.statusDivider} />
            <View style={styles.statusItem}>
              <Text style={[styles.statusNumber, { color: COLORS.secondary }]}>{completedRows}</Text>
              <Text style={styles.statusLabel}>Complete</Text>
            </View>
            <View style={styles.statusDivider} />
            <View style={styles.statusItem}>
              <Text style={[styles.statusNumber, { color: COLORS.warning }]}>{halfRows}</Text>
              <Text style={styles.statusLabel}>Pending</Text>
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            <Text style={styles.instructionTitle}>How to use:</Text>
            <View style={styles.instructionStep}>
              <Text style={styles.stepIcon}>1</Text>
              <Text style={styles.stepText}>WhatsApp me message copy karo</Text>
            </View>
            <View style={styles.instructionStep}>
              <Text style={styles.stepIcon}>2</Text>
              <Text style={styles.stepText}>Photo open karke Scan button dabao</Text>
            </View>
            <View style={styles.instructionStep}>
              <Text style={styles.stepIcon}>3</Text>
              <Text style={styles.stepText}>Data automatically fill ho jayega</Text>
            </View>
          </View>

          {/* Action Buttons */}
          {completedRows > 0 && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearAllRows}
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.processButton}
                onPress={handleProcessData}
              >
                <Text style={styles.processButtonText}>
                  Process {completedRows} Rows
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  toggleButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  toggleButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.border,
    marginRight: 10,
  },
  toggleDotActive: {
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  toggleTextActive: {
    color: COLORS.primary,
  },
  statusPanel: {
    marginTop: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statusItem: {
    alignItems: 'center',
  },
  statusNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statusLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  instructions: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 12,
    fontWeight: '600',
    marginRight: 10,
    overflow: 'hidden',
  },
  stepText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  clearButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  processButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
  },
  processButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default BubbleControls;
