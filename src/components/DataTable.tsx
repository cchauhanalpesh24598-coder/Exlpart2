import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { DataRow } from '../types';
import { TABLE_COLUMNS, COLORS, STATUS_OPTIONS } from '../utils/constants';
import { getAutoFilledFields } from '../services/data-processor';

interface DataTableProps {
  rows: DataRow[];
  onUpdateRow: (rowId: string, updates: Partial<DataRow>) => void;
  onDeleteRow: (rowId: string) => void;
}

interface EditModalProps {
  visible: boolean;
  row: DataRow | null;
  field: keyof DataRow | null;
  onSave: (value: string) => void;
  onClose: () => void;
}

const EditModal: React.FC<EditModalProps> = ({
  visible,
  row,
  field,
  onSave,
  onClose,
}) => {
  const [value, setValue] = useState('');

  React.useEffect(() => {
    if (row && field) {
      setValue(String(row[field] || ''));
    }
  }, [row, field]);

  const handleSave = () => {
    onSave(value);
    onClose();
  };

  const column = TABLE_COLUMNS.find((col) => col.key === field);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            Edit {column?.label || field}
          </Text>
          
          {field === 'status' ? (
            <View style={styles.statusOptions}>
              {STATUS_OPTIONS.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusOption,
                    value === status && styles.statusOptionSelected,
                  ]}
                  onPress={() => setValue(status)}
                >
                  <Text
                    style={[
                      styles.statusOptionText,
                      value === status && styles.statusOptionTextSelected,
                    ]}
                  >
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <TextInput
              style={styles.modalInput}
              value={value}
              onChangeText={setValue}
              placeholder={`Enter ${column?.label || field}`}
              multiline={field === 'reasonOfCNV'}
            />
          )}

          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export const DataTable: React.FC<DataTableProps> = ({
  rows,
  onUpdateRow,
  onDeleteRow,
}) => {
  const [editModal, setEditModal] = useState<{
    visible: boolean;
    row: DataRow | null;
    field: keyof DataRow | null;
  }>({ visible: false, row: null, field: null });

  const openEditModal = (row: DataRow, field: keyof DataRow) => {
    setEditModal({ visible: true, row, field });
  };

  const handleSave = (value: string) => {
    if (editModal.row && editModal.field) {
      onUpdateRow(editModal.row.id, { [editModal.field]: value });
    }
  };

  const handleDelete = (rowId: string) => {
    Alert.alert(
      'Delete Row',
      'Are you sure you want to delete this row?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDeleteRow(rowId) },
      ]
    );
  };

  const renderCell = (row: DataRow, column: typeof TABLE_COLUMNS[0]) => {
    const value = row[column.key] || '';
    const autoFilledFields = getAutoFilledFields(row);
    const isAutoFilled = autoFilledFields.includes(column.key);
    const isEmpty = !value;

    return (
      <TouchableOpacity
        key={column.key}
        style={[
          styles.cell,
          { width: column.width },
          isAutoFilled && !isEmpty && styles.autoFilledCell,
          isEmpty && styles.emptyCell,
        ]}
        onPress={() => column.editable && openEditModal(row, column.key)}
      >
        <Text
          style={[
            styles.cellText,
            isEmpty && styles.emptyCellText,
          ]}
          numberOfLines={2}
        >
          {value || 'Tap to edit'}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderRow = (row: DataRow, index: number) => {
    return (
      <View key={row.id} style={styles.row}>
        <View style={styles.rowNumber}>
          <Text style={styles.rowNumberText}>{index + 1}</Text>
        </View>
        {TABLE_COLUMNS.map((column) => renderCell(row, column))}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(row.id)}
        >
          <Text style={styles.deleteButtonText}>X</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderHeader = () => {
    return (
      <View style={styles.headerRow}>
        <View style={styles.rowNumber}>
          <Text style={styles.headerText}>#</Text>
        </View>
        {TABLE_COLUMNS.map((column) => (
          <View key={column.key} style={[styles.headerCell, { width: column.width }]}>
            <Text style={styles.headerText}>{column.label}</Text>
            {column.autoFilled && (
              <Text style={styles.autoFilledBadge}>Auto</Text>
            )}
          </View>
        ))}
        <View style={styles.deleteHeader}>
          <Text style={styles.headerText}>Del</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View>
          {renderHeader()}
          <ScrollView showsVerticalScrollIndicator={false}>
            {rows.map((row, index) => renderRow(row, index))}
          </ScrollView>
        </View>
      </ScrollView>

      <EditModal
        visible={editModal.visible}
        row={editModal.row}
        field={editModal.field}
        onSave={handleSave}
        onClose={() => setEditModal({ visible: false, row: null, field: null })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
  },
  headerCell: {
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
  },
  autoFilledBadge: {
    fontSize: 8,
    color: '#fff',
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    minHeight: 50,
  },
  rowNumber: {
    width: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
  },
  rowNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  cell: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  autoFilledCell: {
    backgroundColor: COLORS.autoFilledBg,
  },
  emptyCell: {
    backgroundColor: COLORS.emptyBg,
  },
  cellText: {
    fontSize: 12,
    color: COLORS.text,
  },
  emptyCellText: {
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  deleteButton: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
  },
  deleteButtonText: {
    color: COLORS.error,
    fontWeight: 'bold',
    fontSize: 14,
  },
  deleteHeader: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 50,
    marginBottom: 16,
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  statusOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  statusOptionText: {
    fontSize: 14,
    color: COLORS.text,
  },
  statusOptionTextSelected: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  cancelButtonText: {
    color: COLORS.text,
    fontWeight: '500',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default DataTable;
