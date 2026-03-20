import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { DataRow, ExtractedMessageData } from '../types';
import { generateId } from '../services/storage';
import { parseWhatsAppMessage } from '../services/regex-parser';

/**
 * Bubble Context
 * Floating bubble ki state manage karta hai
 * 
 * Row States:
 * - Empty: No data
 * - Half: Only message data (clipboard se)
 * - Full: Message + GPS data (both filled)
 */

export type RowStatus = 'empty' | 'half' | 'full';

export interface BubbleRow {
  id: string;
  rowNumber: number;
  status: RowStatus;
  messageData: ExtractedMessageData | null;
  rawMessage: string;
  gpsData: string | null;
  timestamp: number;
}

interface BubbleContextType {
  // Bubble state
  isBubbleEnabled: boolean;
  setBubbleEnabled: (enabled: boolean) => void;
  
  // Current row
  currentRowNumber: number;
  currentRowStatus: RowStatus;
  
  // Collected rows
  collectedRows: BubbleRow[];
  
  // Actions
  addMessageData: (rawMessage: string, parsed: ExtractedMessageData) => void;
  addGPSData: (gps: string) => void;
  moveToNextRow: () => void;
  resetCurrentRow: () => void;
  clearAllRows: () => void;
  
  // GPS scan state
  lastScannedGPS: string | null;
  setLastScannedGPS: (gps: string | null) => void;
  scanError: string | null;
  setScanError: (error: string | null) => void;
  
  // Convert to DataRows for table
  convertToDataRows: () => DataRow[];
}

const BubbleContext = createContext<BubbleContextType | null>(null);

export function BubbleProvider({ children }: { children: React.ReactNode }) {
  const [isBubbleEnabled, setBubbleEnabled] = useState(false);
  const [currentRowNumber, setCurrentRowNumber] = useState(1);
  const [collectedRows, setCollectedRows] = useState<BubbleRow[]>([]);
  const [lastScannedGPS, setLastScannedGPS] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Calculate current row status
  const getCurrentRow = useCallback((): BubbleRow | undefined => {
    return collectedRows.find(r => r.rowNumber === currentRowNumber);
  }, [collectedRows, currentRowNumber]);

  const currentRowStatus: RowStatus = (() => {
    const row = getCurrentRow();
    if (!row) return 'empty';
    return row.status;
  })();

  // Add message data from clipboard
  const addMessageData = useCallback((rawMessage: string, parsed: ExtractedMessageData) => {
    setCollectedRows(prev => {
      const existingIndex = prev.findIndex(r => r.rowNumber === currentRowNumber);
      
      const newRow: BubbleRow = {
        id: generateId(),
        rowNumber: currentRowNumber,
        status: 'half',
        messageData: parsed,
        rawMessage: rawMessage,
        gpsData: null,
        timestamp: Date.now(),
      };

      if (existingIndex >= 0) {
        // Update existing row
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          messageData: parsed,
          rawMessage: rawMessage,
          status: updated[existingIndex].gpsData ? 'full' : 'half',
        };
        return updated;
      } else {
        // Add new row
        return [...prev, newRow];
      }
    });
    
    // Clear any previous scan error
    setScanError(null);
  }, [currentRowNumber]);

  // Add GPS data from scan
  const addGPSData = useCallback((gps: string) => {
    setLastScannedGPS(gps);
    setScanError(null);
    
    setCollectedRows(prev => {
      const existingIndex = prev.findIndex(r => r.rowNumber === currentRowNumber);
      
      if (existingIndex >= 0) {
        // Update existing row
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          gpsData: gps,
          status: 'full',
        };
        return updated;
      } else {
        // Create new row with only GPS (unusual case)
        const newRow: BubbleRow = {
          id: generateId(),
          rowNumber: currentRowNumber,
          status: 'half', // Only GPS, no message
          messageData: null,
          rawMessage: '',
          gpsData: gps,
          timestamp: Date.now(),
        };
        return [...prev, newRow];
      }
    });
  }, [currentRowNumber]);

  // Move to next row
  const moveToNextRow = useCallback(() => {
    setCurrentRowNumber(prev => prev + 1);
    setLastScannedGPS(null);
    setScanError(null);
  }, []);

  // Reset current row
  const resetCurrentRow = useCallback(() => {
    setCollectedRows(prev => prev.filter(r => r.rowNumber !== currentRowNumber));
    setLastScannedGPS(null);
    setScanError(null);
  }, [currentRowNumber]);

  // Clear all rows
  const clearAllRows = useCallback(() => {
    setCollectedRows([]);
    setCurrentRowNumber(1);
    setLastScannedGPS(null);
    setScanError(null);
  }, []);

  // Convert collected rows to DataRows for table
  const convertToDataRows = useCallback((): DataRow[] => {
    return collectedRows
      .filter(row => row.status === 'full' || row.messageData)
      .sort((a, b) => a.rowNumber - b.rowNumber)
      .map(row => ({
        id: row.id,
        bankName: row.messageData?.bankName || '',
        applicantName: row.messageData?.applicantName || '',
        status: '',
        reasonOfCNV: row.messageData?.reasonOfCNV || '',
        latlongFrom: '',
        latlongTo: row.gpsData || '',
        area: '',
        km: '',
        timestamp: row.timestamp,
        sourceMessageIndex: row.rowNumber - 1,
      }));
  }, [collectedRows]);

  return (
    <BubbleContext.Provider
      value={{
        isBubbleEnabled,
        setBubbleEnabled,
        currentRowNumber,
        currentRowStatus,
        collectedRows,
        addMessageData,
        addGPSData,
        moveToNextRow,
        resetCurrentRow,
        clearAllRows,
        lastScannedGPS,
        setLastScannedGPS,
        scanError,
        setScanError,
        convertToDataRows,
      }}
    >
      {children}
    </BubbleContext.Provider>
  );
}

export function useBubble() {
  const context = useContext(BubbleContext);
  if (!context) {
    throw new Error('useBubble must be used within BubbleProvider');
  }
  return context;
}
