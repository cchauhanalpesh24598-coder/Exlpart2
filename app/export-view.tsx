import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { DataRow } from '../src/types';
import { COLORS, EXCEL_SETTINGS } from '../src/utils/constants';
import { loadRows } from '../src/services/storage';
import {
  exportAndShareExcel,
  saveExcelToDevice,
  exportCSV,
} from '../src/services/excel-export';

export default function ExportViewScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<DataRow[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'xlsx' | 'csv'>('xlsx');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const savedRows = await loadRows();
    setRows(savedRows);
  };

  const handleExportAndShare = async () => {
    setIsExporting(true);
    
    try {
      const success = await exportAndShareExcel(rows);
      
      if (success) {
        Alert.alert('Success', 'Excel file shared successfully!');
      } else {
        Alert.alert('Note', 'Sharing is not available on this device. File saved locally.');
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export file. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveToDevice = async () => {
    setIsExporting(true);
    
    try {
      const filePath = await saveExcelToDevice(rows);
      
      if (filePath) {
        Alert.alert(
          'Saved Successfully',
          `File saved to:\n${filePath}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to save file.');
      }
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save file. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    
    try {
      const filePath = await exportCSV(rows);
      
      if (filePath) {
        Alert.alert(
          'CSV Exported',
          `File saved to:\n${filePath}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to export CSV.');
      }
    } catch (error) {
      console.error('CSV export error:', error);
      Alert.alert('Error', 'Failed to export CSV. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDone = () => {
    router.push('/');
  };

  // Calculate stats
  const totalRows = rows.length;
  const filledCells = rows.reduce((acc, row) => {
    let count = 0;
    if (row.bankName) count++;
    if (row.applicantName) count++;
    if (row.status) count++;
    if (row.reasonOfCNV) count++;
    if (row.latlongFrom) count++;
    if (row.latlongTo) count++;
    if (row.area) count++;
    if (row.km) count++;
    return acc + count;
  }, 0);
  const totalCells = totalRows * 8;
  const fillPercentage = totalCells > 0 ? Math.round((filledCells / totalCells) * 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Export Summary */}
      <View style={styles.summary}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📤</Text>
        </View>
        <Text style={styles.title}>Ready to Export</Text>
        <Text style={styles.subtitle}>
          Your data is ready to be exported to Excel
        </Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalRows}</Text>
          <Text style={styles.statLabel}>Total Rows</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{EXCEL_SETTINGS.headers.length}</Text>
          <Text style={styles.statLabel}>Columns</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{fillPercentage}%</Text>
          <Text style={styles.statLabel}>Data Filled</Text>
        </View>
      </View>

      {/* Column Preview */}
      <View style={styles.columnsPreview}>
        <Text style={styles.columnsTitle}>Columns in Export:</Text>
        <View style={styles.columnsList}>
          {EXCEL_SETTINGS.headers.map((header, index) => (
            <View key={index} style={styles.columnTag}>
              <Text style={styles.columnTagText}>{header}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Export Options */}
      <View style={styles.exportOptions}>
        <TouchableOpacity
          style={styles.exportOption}
          onPress={handleExportAndShare}
          disabled={isExporting}
        >
          <View style={styles.exportOptionIcon}>
            <Text style={styles.optionIconText}>📊</Text>
          </View>
          <View style={styles.exportOptionContent}>
            <Text style={styles.exportOptionTitle}>Share Excel File</Text>
            <Text style={styles.exportOptionSubtitle}>
              Share via WhatsApp, Email, etc.
            </Text>
          </View>
          {isExporting && <ActivityIndicator color={COLORS.primary} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.exportOption}
          onPress={handleSaveToDevice}
          disabled={isExporting}
        >
          <View style={styles.exportOptionIcon}>
            <Text style={styles.optionIconText}>💾</Text>
          </View>
          <View style={styles.exportOptionContent}>
            <Text style={styles.exportOptionTitle}>Save to Device</Text>
            <Text style={styles.exportOptionSubtitle}>
              Save .xlsx file to phone storage
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.exportOption}
          onPress={handleExportCSV}
          disabled={isExporting}
        >
          <View style={styles.exportOptionIcon}>
            <Text style={styles.optionIconText}>📄</Text>
          </View>
          <View style={styles.exportOptionContent}>
            <Text style={styles.exportOptionTitle}>Export as CSV</Text>
            <Text style={styles.exportOptionSubtitle}>
              Compatible with all spreadsheet apps
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
          <Text style={styles.doneButtonText}>Done</Text>
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
  summary: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  columnsPreview: {
    padding: 16,
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  columnsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  columnsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  columnTag: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  columnTagText: {
    fontSize: 12,
    color: COLORS.primary,
  },
  exportOptions: {
    padding: 16,
    gap: 12,
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  exportOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionIconText: {
    fontSize: 20,
  },
  exportOptionContent: {
    flex: 1,
  },
  exportOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  exportOptionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  doneButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
