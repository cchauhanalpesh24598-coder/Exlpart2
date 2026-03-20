import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { useBubble } from '../context/BubbleContext';
import { COLORS } from '../utils/constants';

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
  } = useBubble();

  const completedRows = collectedRows.filter(r => r.status === 'full').length;
  const halfRows = collectedRows.filter(r => r.status === 'half').length;

  const handleToggle = () => {
    if (isBubbleEnabled) {
      // If disabling and has data, ask confirmation
      if (collectedRows.length > 0) {
        // Will be handled in parent component
      }
    }
    setBubbleEnabled(!isBubbleEnabled);
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
