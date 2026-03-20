import AsyncStorage from '@react-native-async-storage/async-storage';
import { DataRow } from '../types';
import { STORAGE_KEYS } from '../utils/constants';

/**
 * Save rows to AsyncStorage
 */
export async function saveRows(rows: DataRow[]): Promise<boolean> {
  try {
    const jsonValue = JSON.stringify(rows);
    await AsyncStorage.setItem(STORAGE_KEYS.savedRows, jsonValue);
    return true;
  } catch (error) {
    console.error('Error saving rows:', error);
    return false;
  }
}

/**
 * Load rows from AsyncStorage
 */
export async function loadRows(): Promise<DataRow[]> {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.savedRows);
    if (jsonValue) {
      return JSON.parse(jsonValue) as DataRow[];
    }
    return [];
  } catch (error) {
    console.error('Error loading rows:', error);
    return [];
  }
}

/**
 * Add a single row
 */
export async function addRow(row: DataRow): Promise<boolean> {
  try {
    const existingRows = await loadRows();
    existingRows.push(row);
    return await saveRows(existingRows);
  } catch (error) {
    console.error('Error adding row:', error);
    return false;
  }
}

/**
 * Update a row by ID
 */
export async function updateRow(
  rowId: string,
  updates: Partial<DataRow>
): Promise<boolean> {
  try {
    const rows = await loadRows();
    const index = rows.findIndex((row) => row.id === rowId);
    
    if (index === -1) {
      return false;
    }

    rows[index] = { ...rows[index], ...updates };
    return await saveRows(rows);
  } catch (error) {
    console.error('Error updating row:', error);
    return false;
  }
}

/**
 * Delete a row by ID
 */
export async function deleteRow(rowId: string): Promise<boolean> {
  try {
    const rows = await loadRows();
    const filteredRows = rows.filter((row) => row.id !== rowId);
    return await saveRows(filteredRows);
  } catch (error) {
    console.error('Error deleting row:', error);
    return false;
  }
}

/**
 * Clear all rows
 */
export async function clearAllRows(): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.savedRows);
    return true;
  } catch (error) {
    console.error('Error clearing rows:', error);
    return false;
  }
}

/**
 * Get row count
 */
export async function getRowCount(): Promise<number> {
  const rows = await loadRows();
  return rows.length;
}

/**
 * Save app settings
 */
export async function saveSettings(settings: Record<string, any>): Promise<boolean> {
  try {
    const jsonValue = JSON.stringify(settings);
    await AsyncStorage.setItem(STORAGE_KEYS.appSettings, jsonValue);
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
}

/**
 * Load app settings
 */
export async function loadSettings(): Promise<Record<string, any>> {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.appSettings);
    if (jsonValue) {
      return JSON.parse(jsonValue);
    }
    return {};
  } catch (error) {
    console.error('Error loading settings:', error);
    return {};
  }
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
