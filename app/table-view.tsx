import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SharedDataContext } from './_layout';
import { DataTable } from '../src/components/DataTable';
import { LoadingIndicator } from '../src/components/LoadingIndicator';
import { DataRow } from '../src/types';
import { COLORS } from '../src/utils/constants';
import { processSharedContent, createEmptyRow } from '../src/services/data-processor';
import { saveRows, loadRows, updateRow, deleteRow } from '../src/services/storage';
import { useBubble } from '../src/context/BubbleContext';

export default function TableViewScreen() {
  const router = useRouter();
  const { messages, photos, rows: contextRows, setRows: setContextRows } = useContext(SharedDataContext);
  const { collectedRows } = useBubble();
  
  const [rows, setRows] = useState<DataRow[]>(contextRows || []);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);

  useEffect(() => {
    // Check if we have rows from context (from bubble or shared content)
    if (contextRows && contextRows.length > 0) {
      setRows(contextRows);
      // Save to storage
      saveRows(contextRows);
    } else if (messages.length > 0) {
      // Process shared messages
      processData();
    } else {
      // Load existing rows for manual entry
      loadExistingRows();
    }
  }, []);

  const loadExistingRows = async () => {
    const savedRows = await loadRows();
    setRows(savedRows);
  };

  const processData = async () => {
    setIsProcessing(true);
    setProcessingStep('Starting processing...');
    setProcessingProgress(0);

    try {
      // Process all shared content
      const extractedRows = await processSharedContent(
        messages,
        photos,
        (step, progress) => {
          setProcessingStep(step);
          setProcessingProgress(progress);
        }
      );

      setRows(extractedRows);
      setContextRows(extractedRows);
      
      // Save to storage
      await saveRows(extractedRows);
      
      setProcessingStep('Processing complete!');
      setProcessingProgress(100);
      
      // Small delay to show completion
      setTimeout(() => {
        setIsProcessing(false);
      }, 500);
    } catch (error) {
      console.error('Processing error:', error);
      Alert.alert('Error', 'Failed to process data. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleUpdateRow = async (rowId: string, updates: Partial<DataRow>) => {
    // Update local state
    setRows((prevRows) =>
      prevRows.map((row) =>
        row.id === rowId ? { ...row, ...updates } : row
      )
    );

    // Update storage
    await updateRow(rowId, updates);
  };

  const handleDeleteRow = async (rowId: string) => {
    // Update local state
    setRows((prevRows) => prevRows.filter((row) => row.id !== rowId));

    // Update storage
    await deleteRow(rowId);
  };

  const handleAddRow = () => {
    const newRow = createEmptyRow();
    setRows((prevRows) => [...prevRows, newRow]);
  };

  const handleExport = () => {
    if (rows.length === 0) {
      Alert.alert('No Data', 'Please add some data before exporting.');
      return;
    }
    router.push('/export-view');
  };

  const handleReprocess = () => {
    Alert.alert(
      'Reprocess Data',
      'This will clear current data and reprocess from shared content.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reprocess', onPress: processData },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Loading Indicator */}
      <LoadingIndicator
        step={processingStep}
        progress={processingProgress}
        isVisible={isProcessing}
      />

      {/* Header Stats */}
      <View style={styles.statsBar}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{rows.length}</Text>
          <Text style={styles.statLabel}>Rows</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNumber}>
            {rows.filter((r) => r.bankName || r.applicantName).length}
          </Text>
          <Text style={styles.statLabel}>Auto-filled</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNumber}>
            {rows.filter((r) => r.latlongTo).length}
          </Text>
          <Text style={styles.statLabel}>GPS Found</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.autoFilledBg }]} />
          <Text style={styles.legendText}>Auto-filled</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.emptyBg, borderWidth: 1, borderColor: COLORS.border }]} />
          <Text style={styles.legendText}>Manual entry</Text>
        </View>
      </View>

      {/* Data Table */}
      <View style={styles.tableContainer}>
        {rows.length > 0 ? (
          <DataTable
            rows={rows}
            onUpdateRow={handleUpdateRow}
            onDeleteRow={handleDeleteRow}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No data yet</Text>
            <Text style={styles.emptySubtext}>
              Add rows manually or share content from WhatsApp
            </Text>
          </View>
        )}
      </View>

      {/* Bottom Action Bar */}
      <View style={styles.actionBar}>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.addButton} onPress={handleAddRow}>
            <Text style={styles.addButtonText}>+ Add Row</Text>
          </TouchableOpacity>

          {messages.length > 0 && (
            <TouchableOpacity
              style={styles.reprocessButton}
              onPress={handleReprocess}
            >
              <Text style={styles.reprocessButtonText}>Reprocess</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.exportButton,
            rows.length === 0 && styles.exportButtonDisabled,
          ]}
          onPress={handleExport}
          disabled={rows.length === 0}
        >
          <Text style={styles.exportButtonText}>Export to Excel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  tableContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  actionBar: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  addButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  addButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  reprocessButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  reprocessButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  exportButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  exportButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
