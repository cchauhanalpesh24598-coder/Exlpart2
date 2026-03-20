import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useBubble, RowStatus } from '../context/BubbleContext';
import { startClipboardMonitoring, stopClipboardMonitoring, resetClipboardState } from '../services/clipboard-service';
import { parseManualGPSInput } from '../services/screen-capture-service';
import { COLORS } from '../utils/constants';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BUBBLE_SIZE = 56;
const RING_STROKE = 4; // Increased for better visibility
const RING_PADDING = 3; // Gap between bubble and ring
const RING_SIZE = BUBBLE_SIZE + (RING_PADDING * 2) + (RING_STROKE * 2); // Perfect alignment
const SCAN_BUTTON_SIZE = 32;

interface FloatingBubbleProps {
  onScanPress: () => void;
  isScanning?: boolean;
}

export function FloatingBubble({ onScanPress, isScanning = false }: FloatingBubbleProps) {
  const {
    isBubbleEnabled,
    setBubbleEnabled,
    currentRowNumber,
    currentRowStatus,
    addMessageData,
    addGPSData,
    moveToNextRow,
    resetCurrentRow,
    lastScannedGPS,
    scanError,
    collectedRows,
  } = useBubble();

  // Position state
  const pan = useRef(new Animated.ValueXY({ x: SCREEN_WIDTH - BUBBLE_SIZE - 20, y: SCREEN_HEIGHT / 2 })).current;
  
  // Animation for progress ring
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Modal state for GPS input
  const [showGPSModal, setShowGPSModal] = useState(false);
  const [manualGPSInput, setManualGPSInput] = useState('');
  
  // Long press state
  const [showMenu, setShowMenu] = useState(false);

  // Update progress animation based on row status
  useEffect(() => {
    let toValue = 0;
    switch (currentRowStatus) {
      case 'empty':
        toValue = 0;
        break;
      case 'half':
        toValue = 0.5;
        break;
      case 'full':
        toValue = 1;
        break;
    }
    
    Animated.spring(progressAnim, {
      toValue,
      useNativeDriver: false,
      friction: 8,
    }).start();
  }, [currentRowStatus]);

  // Start clipboard monitoring when bubble is enabled
  useEffect(() => {
    if (isBubbleEnabled) {
      resetClipboardState();
      const cleanup = startClipboardMonitoring((content, parsed) => {
        // Add message data
        addMessageData(content, parsed);
      }, 800);

      return cleanup;
    } else {
      stopClipboardMonitoring();
    }
  }, [isBubbleEnabled, addMessageData]);

  // Auto move to next row when current row is complete
  useEffect(() => {
    if (currentRowStatus === 'full') {
      // Small delay before moving to next row
      const timer = setTimeout(() => {
        moveToNextRow();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentRowStatus, moveToNextRow]);

  // Pan responder for dragging
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset();
        
        // Snap to edge
        const finalX = gesture.moveX > SCREEN_WIDTH / 2 
          ? SCREEN_WIDTH - BUBBLE_SIZE - 20 
          : 20;
        
        // Keep within bounds
        let finalY = Math.max(50, Math.min(SCREEN_HEIGHT - BUBBLE_SIZE - 100, (pan.y as any)._value));
        
        Animated.spring(pan, {
          toValue: { x: finalX, y: finalY },
          useNativeDriver: false,
          friction: 7,
        }).start();
      },
    })
  ).current;

  // Handle long press
  const handleLongPress = () => {
    setShowMenu(true);
  };

  // Handle scan button press
  const handleScanPress = () => {
    if (scanError || !lastScannedGPS) {
      // Show manual input modal
      setShowGPSModal(true);
    } else {
      onScanPress();
    }
  };

  // Handle manual GPS submit
  const handleManualGPSSubmit = () => {
    const parsed = parseManualGPSInput(manualGPSInput);
    if (parsed) {
      addGPSData(parsed.formatted);
      setShowGPSModal(false);
      setManualGPSInput('');
    } else {
      Alert.alert('Invalid Format', 'Please enter GPS in format: 22.1234,71.1234');
    }
  };

  // Handle disable bubble
  const handleDisable = () => {
    setBubbleEnabled(false);
    setShowMenu(false);
  };

  // Handle reset
  const handleReset = () => {
    resetCurrentRow();
    setShowMenu(false);
  };

  if (!isBubbleEnabled) {
    return null;
  }

  // Calculate progress ring - radius should be exactly at bubble edge + padding
  // Ring radius = half of bubble + padding + half of stroke
  const radius = (BUBBLE_SIZE / 2) + RING_PADDING + (RING_STROKE / 2);
  const circumference = 2 * Math.PI * radius;
  
  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const ringColor = currentRowStatus === 'full' 
    ? COLORS.secondary 
    : currentRowStatus === 'half' 
      ? '#FF9800' 
      : COLORS.border;

  return (
    <>
      <Animated.View
        style={[
          styles.bubbleContainer,
          {
            transform: [{ translateX: pan.x }, { translateY: pan.y }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Progress Ring - SVG based for perfect alignment */}
        <View style={styles.progressRingContainer}>
          <Svg width={RING_SIZE} height={RING_SIZE} style={styles.progressRingSvg}>
            {/* Background Circle */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={radius}
              stroke={COLORS.border}
              strokeWidth={RING_STROKE}
              fill="transparent"
            />
            {/* Progress Circle */}
            <AnimatedCircle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={radius}
              stroke={ringColor}
              strokeWidth={RING_STROKE}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
            />
          </Svg>
        </View>

        {/* Main Bubble - Centered inside ring */}
        <TouchableOpacity
          style={styles.bubble}
          onLongPress={handleLongPress}
          delayLongPress={500}
          activeOpacity={0.9}
        >
          <Text style={styles.rowNumber}>{currentRowNumber}</Text>
          <Text style={styles.rowLabel}>Row</Text>
        </TouchableOpacity>

        {/* Scan Button */}
        <TouchableOpacity
          style={[
            styles.scanButton,
            isScanning && styles.scanButtonActive,
            scanError && styles.scanButtonError,
          ]}
          onPress={handleScanPress}
        >
          <Text style={styles.scanButtonText}>
            {isScanning ? '...' : scanError ? '!' : 'Scan'}
          </Text>
        </TouchableOpacity>

        {/* GPS Result Box */}
        {(lastScannedGPS || scanError) && (
          <View style={[styles.gpsBox, scanError && styles.gpsBoxError]}>
            <Text style={[styles.gpsText, scanError && styles.gpsTextError]} numberOfLines={1}>
              {scanError || lastScannedGPS}
            </Text>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setShowGPSModal(true)}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Collected Count Badge */}
        {collectedRows.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{collectedRows.filter(r => r.status === 'full').length}</Text>
          </View>
        )}
      </Animated.View>

      {/* Long Press Menu */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
            <Text style={styles.menuTitle}>Bubble Options</Text>
            
            <TouchableOpacity style={styles.menuItem} onPress={handleReset}>
              <Text style={styles.menuItemText}>Reset Current Row</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={handleDisable}>
              <Text style={[styles.menuItemText, { color: COLORS.error }]}>
                Disable Bubble
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.menuItem, styles.menuItemCancel]} 
              onPress={() => setShowMenu(false)}
            >
              <Text style={styles.menuItemText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Manual GPS Input Modal */}
      <Modal
        visible={showGPSModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGPSModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Enter GPS Coordinates</Text>
            <Text style={styles.modalSubtitle}>Format: 22.1234,71.1234</Text>
            
            <TextInput
              style={styles.gpsInput}
              value={manualGPSInput}
              onChangeText={setManualGPSInput}
              placeholder="22.1234,71.1234"
              keyboardType="decimal-pad"
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonCancel}
                onPress={() => {
                  setShowGPSModal(false);
                  setManualGPSInput('');
                }}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalButtonSubmit}
                onPress={handleManualGPSSubmit}
              >
                <Text style={styles.modalButtonSubmitText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bubbleContainer: {
    position: 'absolute',
    zIndex: 9999,
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingContainer: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingSvg: {
    transform: [{ rotate: '0deg' }],
  },
  bubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  rowNumber: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  rowLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
  },
  scanButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: SCAN_BUTTON_SIZE,
    height: SCAN_BUTTON_SIZE,
    borderRadius: SCAN_BUTTON_SIZE / 2,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  scanButtonActive: {
    backgroundColor: COLORS.warning,
  },
  scanButtonError: {
    backgroundColor: COLORS.error,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  gpsBox: {
    position: 'absolute',
    top: RING_SIZE + 4,
    backgroundColor: COLORS.surface,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 6,
    minWidth: 100,
    maxWidth: 150,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  gpsBoxError: {
    backgroundColor: '#ffebee',
  },
  gpsText: {
    fontSize: 11,
    color: COLORS.text,
    flex: 1,
  },
  gpsTextError: {
    color: COLORS.error,
  },
  editButton: {
    marginLeft: 4,
    padding: 2,
  },
  editButtonText: {
    fontSize: 10,
    color: COLORS.primary,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    width: 280,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  menuItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuItemCancel: {
    borderBottomWidth: 0,
    marginTop: 8,
  },
  menuItemText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    width: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  gpsInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButtonCancel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalButtonCancelText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  modalButtonSubmit: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalButtonSubmitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
