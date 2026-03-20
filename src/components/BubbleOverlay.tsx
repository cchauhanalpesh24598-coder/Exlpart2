import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import { FloatingBubble } from './FloatingBubble';
import { useBubble } from '../context/BubbleContext';
import { extractLatLongFromText } from '../services/screen-capture-service';
import { performOCR } from '../services/ocr-handler';

/**
 * BubbleOverlay Component
 * 
 * Ye component FloatingBubble ko wrap karta hai aur
 * screen scan functionality provide karta hai.
 * 
 * Note: Actual screen capture requires native module.
 * Yahan pe OCR directly photo se hoga.
 */

interface BubbleOverlayProps {
  children: React.ReactNode;
  currentPhotoUri?: string | null;
}

export function BubbleOverlay({ children, currentPhotoUri }: BubbleOverlayProps) {
  const { isBubbleEnabled, addGPSData, setScanError, setLastScannedGPS } = useBubble();
  const [isScanning, setIsScanning] = useState(false);

  // Handle scan button press
  const handleScan = useCallback(async () => {
    if (!currentPhotoUri) {
      Alert.alert(
        'No Image',
        'Please open an image in WhatsApp first, then use the scan button.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsScanning(true);
    setScanError(null);
    setLastScannedGPS(null);

    try {
      // Perform OCR on the image
      const ocrText = await performOCR(currentPhotoUri);
      
      if (!ocrText) {
        setScanError('No text found');
        setIsScanning(false);
        return;
      }

      // Extract GPS from OCR text
      const gpsResult = extractLatLongFromText(ocrText);
      
      if (gpsResult) {
        addGPSData(gpsResult.formatted);
      } else {
        setScanError('GPS not found');
      }
    } catch (error) {
      console.error('Scan error:', error);
      setScanError('Scan failed');
    } finally {
      setIsScanning(false);
    }
  }, [currentPhotoUri, addGPSData, setScanError, setLastScannedGPS]);

  return (
    <View style={styles.container}>
      {children}
      
      {isBubbleEnabled && (
        <FloatingBubble
          onScanPress={handleScan}
          isScanning={isScanning}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default BubbleOverlay;
