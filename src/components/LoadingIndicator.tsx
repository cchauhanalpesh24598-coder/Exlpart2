import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from 'react-native';
import { COLORS } from '../utils/constants';

interface LoadingIndicatorProps {
  step: string;
  progress: number;
  isVisible: boolean;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  step,
  progress,
  isVisible,
}) => {
  const progressWidth = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(progressWidth, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        
        <Text style={styles.stepText}>{step}</Text>
        
        <View style={styles.progressContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressWidth.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        
        <Text style={styles.progressText}>{Math.round(progress)}%</Text>
      </View>
    </View>
  );
};

interface ProcessingStatusProps {
  currentStep: number;
  totalSteps: number;
  stepDescriptions: string[];
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  currentStep,
  totalSteps,
  stepDescriptions,
}) => {
  return (
    <View style={styles.statusContainer}>
      {stepDescriptions.map((description, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        
        return (
          <View key={index} style={styles.stepItem}>
            <View
              style={[
                styles.stepDot,
                isCompleted && styles.stepDotCompleted,
                isCurrent && styles.stepDotCurrent,
              ]}
            >
              {isCompleted && <Text style={styles.checkmark}>✓</Text>}
              {isCurrent && (
                <ActivityIndicator size="small" color="#fff" />
              )}
            </View>
            <Text
              style={[
                styles.stepDescription,
                isCompleted && styles.stepDescriptionCompleted,
                isCurrent && styles.stepDescriptionCurrent,
              ]}
            >
              {description}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    width: '80%',
    maxWidth: 300,
  },
  stepText: {
    fontSize: 16,
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  progressContainer: {
    width: '100%',
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 10,
    fontWeight: '600',
  },
  statusContainer: {
    padding: 20,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepDotCompleted: {
    backgroundColor: COLORS.secondary,
  },
  stepDotCurrent: {
    backgroundColor: COLORS.primary,
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
  stepDescriptionCompleted: {
    color: COLORS.secondary,
    textDecorationLine: 'line-through',
  },
  stepDescriptionCurrent: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default LoadingIndicator;
